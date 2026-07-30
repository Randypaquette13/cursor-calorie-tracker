import * as SecureStore from 'expo-secure-store';

import type { ParsedFoodResponse, ParsedFoodItem, MealType } from '@/types/food';

const API_BASE = 'https://api.cursor.com/v1';
const AGENT_ID_KEY = 'cursor_parser_agent_id';
const API_KEY_KEY = 'cursor_api_key';

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. Given a natural-language food description, estimate calories and macros.

Respond with ONLY valid JSON (no markdown, no commentary) in this exact shape:
{
  "items": [
    {
      "name": "string",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "mealType": "breakfast" | "lunch" | "dinner" | "snack" | null
    }
  ]
}

Rules:
- Split multi-item meals into separate items when possible.
- Infer mealType from words like breakfast/lunch/dinner/snack, otherwise null.
- Use reasonable portion estimates when amounts are vague.
- All macro and calorie values must be numbers.`;

export async function getStoredApiKey() {
  return SecureStore.getItemAsync(API_KEY_KEY);
}

export async function saveApiKey(apiKey: string) {
  await SecureStore.setItemAsync(API_KEY_KEY, apiKey.trim());
  await SecureStore.deleteItemAsync(AGENT_ID_KEY);
}

export async function clearApiKey() {
  await SecureStore.deleteItemAsync(API_KEY_KEY);
  await SecureStore.deleteItemAsync(AGENT_ID_KEY);
}

async function cursorFetch(path: string, apiKey: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Cursor API error (${response.status})`);
  }

  return response.json();
}

async function getOrCreateAgent(apiKey: string) {
  const existing = await SecureStore.getItemAsync(AGENT_ID_KEY);
  if (existing) {
    return existing;
  }

  const data = (await cursorFetch('/agents', apiKey, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Calorie Parser',
      prompt: { text: SYSTEM_PROMPT },
    }),
  })) as { agent: { id: string } };

  await SecureStore.setItemAsync(AGENT_ID_KEY, data.agent.id);
  return data.agent.id;
}

async function waitForRun(agentId: string, runId: string, apiKey: string) {
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    const run = (await cursorFetch(
      `/agents/${agentId}/runs/${runId}`,
      apiKey,
    )) as { status: string; result?: string };

    if (run.status === 'FINISHED') {
      return run.result ?? '';
    }

    if (run.status === 'ERROR' || run.status === 'CANCELLED' || run.status === 'EXPIRED') {
      throw new Error(`Cursor run failed with status ${run.status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Cursor took too long to parse this meal. Try again.');
}

function extractJson(text: string): ParsedFoodResponse {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  const parsed = JSON.parse(candidate) as ParsedFoodResponse;
  if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error('Cursor returned an empty food parse.');
  }

  return {
    items: parsed.items.map(normalizeItem),
  };
}

function normalizeItem(item: ParsedFoodItem): ParsedFoodItem {
  return {
    name: item.name?.trim() || 'Unknown food',
    calories: Number(item.calories) || 0,
    protein: Number(item.protein) || 0,
    carbs: Number(item.carbs) || 0,
    fat: Number(item.fat) || 0,
    mealType: (item.mealType as MealType | null | undefined) ?? null,
  };
}

export async function parseNaturalLanguage(input: string): Promise<ParsedFoodResponse> {
  const apiKey = await getStoredApiKey();
  if (!apiKey) {
    throw new Error('Add your Cursor API key in Settings first.');
  }

  const agentId = await getOrCreateAgent(apiKey);
  const runData = (await cursorFetch(`/agents/${agentId}/runs`, apiKey, {
    method: 'POST',
    body: JSON.stringify({
      prompt: {
        text: `${SYSTEM_PROMPT}\n\nFood description: ${input}`,
      },
    }),
  })) as { run: { id: string } };

  const resultText = await waitForRun(agentId, runData.run.id, apiKey);
  return extractJson(resultText);
}

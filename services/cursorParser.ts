import * as SecureStore from 'expo-secure-store';

import { formatJaredModeStoresForPrompt } from '@/config/jaredMode';
import { getJaredModeEnabled } from '@/services/jaredMode';
import type { ParsedFoodResponse, ParsedFoodItem, MealType, SavedFood } from '@/types/food';
import { applyPortionRanges, nutritionFieldFromRecord } from '@/utils/nutrition';

const API_BASE = 'https://api.cursor.com/v1';
const AGENT_ID_KEY = 'cursor_parser_agent_id';
const API_KEY_KEY = 'cursor_api_key';
const PARSER_VERSION_KEY = 'cursor_parser_version';
const PARSER_VERSION = '4';

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. Given a natural-language food description, estimate calories and macros.

Respond with ONLY valid JSON (no markdown, no commentary) in this exact shape:
{
  "items": [
    {
      "name": "string",
      "calories": { "min": number, "max": number },
      "protein": { "min": number, "max": number },
      "carbs": { "min": number, "max": number },
      "fat": { "min": number, "max": number },
      "mealType": "breakfast" | "lunch" | "dinner" | "snack" | null
    }
  ]
}

Rules:
- Split multi-item meals into separate items when possible.
- Infer mealType from words like breakfast/lunch/dinner/snack, otherwise null.
- WEIGHED portions (grams, oz, lb, kg explicitly stated for that item): set min and max equal or within ~3% — the user measured mass.
- WEIGHED but COMPOSITE/HOMEMADE (e.g. "200g of my chili", "150g homemade curry"): use a small range (~10%) because ingredient ratios are uncertain even when total weight is known.
- NOT WEIGHED: default to a range with min lower than max. This includes cups, bowls, plates, "some", "a serving", restaurant portions, and any item without a scale weight.
- Count-based items without weight (e.g. "2 eggs"): small range (~10%) is OK.
- Volume measures without weight (cups, tbsp): moderate range (~15-25%).
- Vague amounts ("some rice", "handful of nuts"): wider range (~25-40%).
- All min/max values must be numbers with min <= max.
- When the user mentions a saved food by name (exact or close match), use that food's description and known nutrition instead of guessing; use exact values (min = max) when saved nutrition is known.`;

const FOLLOW_UP_SUFFIX = `Respond with ONLY valid JSON (no markdown, no commentary) in the same shape as before.`;

export type CursorRunStatus = 'CREATING' | 'RUNNING' | 'FINISHED' | 'ERROR' | 'CANCELLED' | 'EXPIRED';

export interface CursorRunSnapshot {
  status: CursorRunStatus;
  result?: string;
}

function formatSavedFoodsForPrompt(savedFoods: SavedFood[]): string {
  if (savedFoods.length === 0) return '';

  const lines = savedFoods.map((food) => {
    const known =
      food.calories != null
        ? ` Known nutrition: ${Math.round(food.calories)} cal, P ${Math.round(food.protein ?? 0)}g, C ${Math.round(food.carbs ?? 0)}g, F ${Math.round(food.fat ?? 0)}g.`
        : '';
    return `- "${food.name}": ${food.description}.${known}`;
  });

  return `\n\nThe user has saved these personal foods. When their input matches or refers to a saved food name, use that food's description and known nutrition (when provided) instead of guessing:\n${lines.join('\n')}`;
}

function buildInitialParsePrompt(
  input: string,
  savedFoods: SavedFood[],
  jaredModeEnabled: boolean,
): string {
  const jaredContext = jaredModeEnabled ? formatJaredModeStoresForPrompt() : '';
  return `${SYSTEM_PROMPT}${jaredContext}${formatSavedFoodsForPrompt(savedFoods)}\n\nFood description: ${input}`;
}

function buildFollowUpParsePrompt(
  input: string,
  savedFoods: SavedFood[],
  jaredModeEnabled: boolean,
): string {
  const jaredContext = jaredModeEnabled ? formatJaredModeStoresForPrompt() : '';
  return `${jaredContext}${formatSavedFoodsForPrompt(savedFoods)}\n\nFood description: ${input}\n\n${FOLLOW_UP_SUFFIX}`;
}

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

async function ensureParserVersion() {
  const stored = await SecureStore.getItemAsync(PARSER_VERSION_KEY);
  if (stored !== PARSER_VERSION) {
    await SecureStore.deleteItemAsync(AGENT_ID_KEY);
    await SecureStore.setItemAsync(PARSER_VERSION_KEY, PARSER_VERSION);
  }
}

async function createAgent(apiKey: string) {
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

async function getOrCreateAgent(apiKey: string) {
  await ensureParserVersion();
  const existing = await SecureStore.getItemAsync(AGENT_ID_KEY);
  if (existing) {
    return { agentId: existing, isNewAgent: false };
  }

  const agentId = await createAgent(apiKey);
  return { agentId, isNewAgent: true };
}

export async function startParseRun(input: string, savedFoods: SavedFood[] = []) {
  const apiKey = await getStoredApiKey();
  if (!apiKey) {
    throw new Error('Add your Cursor API key in Settings first.');
  }

  const { agentId, isNewAgent } = await getOrCreateAgent(apiKey);
  const jaredModeEnabled = await getJaredModeEnabled();
  const promptText = isNewAgent
    ? buildInitialParsePrompt(input, savedFoods, jaredModeEnabled)
    : buildFollowUpParsePrompt(input, savedFoods, jaredModeEnabled);

  const runData = (await cursorFetch(`/agents/${agentId}/runs`, apiKey, {
    method: 'POST',
    body: JSON.stringify({
      prompt: {
        text: promptText,
      },
    }),
  })) as { run: { id: string } };

  return {
    agentId,
    runId: runData.run.id,
    apiKey,
  };
}

export async function fetchRunSnapshot(
  agentId: string,
  runId: string,
  apiKey: string,
): Promise<CursorRunSnapshot> {
  const run = (await cursorFetch(`/agents/${agentId}/runs/${runId}`, apiKey)) as {
    status: CursorRunStatus;
    result?: string;
  };

  return {
    status: run.status,
    result: run.result,
  };
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

function normalizeItem(item: unknown): ParsedFoodItem {
  const record = (item ?? {}) as Record<string, unknown>;
  const calories = nutritionFieldFromRecord(record, 'calories');
  const protein = nutritionFieldFromRecord(record, 'protein');
  const carbs = nutritionFieldFromRecord(record, 'carbs');
  const fat = nutritionFieldFromRecord(record, 'fat');

  return {
    name: String(record.name ?? '').trim() || 'Unknown food',
    calories: calories.point,
    protein: protein.point,
    carbs: carbs.point,
    fat: fat.point,
    caloriesMin: calories.min,
    caloriesMax: calories.max,
    proteinMin: protein.min,
    proteinMax: protein.max,
    carbsMin: carbs.min,
    carbsMax: carbs.max,
    fatMin: fat.min,
    fatMax: fat.max,
    mealType: (record.mealType as MealType | null | undefined) ?? null,
  };
}

function usesKnownSavedFood(item: ParsedFoodItem, input: string, savedFoods: SavedFood[]) {
  const lowerInput = input.toLowerCase();
  const lowerItem = item.name.toLowerCase();

  return savedFoods.some((food) => {
    if (food.calories == null) return false;
    const name = food.name.trim().toLowerCase();
    return lowerInput.includes(name) || lowerItem.includes(name) || name.includes(lowerItem);
  });
}

function finalizeParsedItem(
  item: ParsedFoodItem,
  input: string,
  savedFoods: SavedFood[],
): ParsedFoodItem {
  if (usesKnownSavedFood(item, input, savedFoods)) {
    return item;
  }
  return applyPortionRanges(item, input);
}

export function parseRunResult(
  resultText: string,
  input: string,
  savedFoods: SavedFood[] = [],
): ParsedFoodResponse {
  const parsed = extractJson(resultText);
  return {
    items: parsed.items.map((item) => finalizeParsedItem(item, input, savedFoods)),
  };
}

export function isTerminalRunStatus(status: CursorRunStatus) {
  return status === 'FINISHED' || status === 'ERROR' || status === 'CANCELLED' || status === 'EXPIRED';
}

export function runStatusError(status: CursorRunStatus) {
  if (status === 'ERROR' || status === 'CANCELLED' || status === 'EXPIRED') {
    return `Cursor run failed with status ${status}`;
  }
  return null;
}

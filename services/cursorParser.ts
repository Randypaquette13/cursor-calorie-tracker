import * as SecureStore from 'expo-secure-store';

import {
  FOOD_SYSTEM_PROMPT,
  buildFollowUpFoodParsePrompt,
  buildInitialFoodParsePrompt,
} from '@/services/parsePrompts';
import type { ParsedFoodResponse, ParsedFoodItem, MealType, SavedFood } from '@/types/food';
import { applyPortionRanges, nutritionFieldFromRecord } from '@/utils/nutrition';

const API_BASE = 'https://api.cursor.com/v1';
const AGENT_ID_KEY = 'cursor_parser_agent_id';
const PARSER_VERSION_KEY = 'cursor_parser_version';
const PARSER_VERSION = '4';

const FOLLOW_UP_SUFFIX = `Respond with ONLY valid JSON (no markdown, no commentary) in the same shape as before.`;

export type CursorRunStatus = 'CREATING' | 'RUNNING' | 'FINISHED' | 'ERROR' | 'CANCELLED' | 'EXPIRED';

export interface CursorRunSnapshot {
  status: CursorRunStatus;
  result?: string;
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
      prompt: { text: FOOD_SYSTEM_PROMPT },
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

export async function startCursorFoodParseRun(input: string, savedFoods: SavedFood[] = [], apiKey: string) {
  const { agentId, isNewAgent } = await getOrCreateAgent(apiKey);
  const promptText = isNewAgent
    ? buildInitialFoodParsePrompt(input, savedFoods)
    : buildFollowUpFoodParsePrompt(input, savedFoods);

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

export async function fetchCursorRunSnapshot(
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
    throw new Error('Parser returned an empty food parse.');
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

// Backward-compatible re-exports
export { fetchCursorRunSnapshot as fetchRunSnapshot };
export { startCursorFoodParseRun as startParseRun };
export {
  getCursorApiKey as getStoredApiKey,
  saveCursorApiKey as saveApiKey,
  clearCursorApiKey as clearApiKey,
} from '@/services/aiProviderSettings';

export { FOLLOW_UP_SUFFIX };

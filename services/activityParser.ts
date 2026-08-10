import * as SecureStore from 'expo-secure-store';

import {
  getAiProvider,
  getStoredApiKeyForProvider,
  missingApiKeyMessage,
} from '@/services/aiProviderSettings';
import { parseActivityWithClaude } from '@/services/claudeParser';
import {
  ACTIVITY_SYSTEM_PROMPT,
  buildFollowUpActivityPrompt,
  buildInitialActivityPrompt,
} from '@/services/parsePrompts';
import {
  fetchCursorRunSnapshot,
  runStatusError,
  type CursorRunStatus,
} from '@/services/cursorParser';
import type { ParsedActivityResponse } from '@/types/profile';
import type { StravaActivitySummary } from '@/types/strava';
import { parseStravaActivitiesJson } from '@/utils/strava';

const API_BASE = 'https://api.cursor.com/v1';
const ACTIVITY_AGENT_ID_KEY = 'cursor_activity_agent_id';
const ACTIVITY_PARSER_VERSION_KEY = 'cursor_activity_parser_version';
const ACTIVITY_PARSER_VERSION = '2';

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

async function ensureActivityParserVersion() {
  const stored = await SecureStore.getItemAsync(ACTIVITY_PARSER_VERSION_KEY);
  if (stored !== ACTIVITY_PARSER_VERSION) {
    await SecureStore.deleteItemAsync(ACTIVITY_AGENT_ID_KEY);
    await SecureStore.setItemAsync(ACTIVITY_PARSER_VERSION_KEY, ACTIVITY_PARSER_VERSION);
  }
}

async function createActivityAgent(apiKey: string) {
  const data = (await cursorFetch('/agents', apiKey, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Activity Burn Estimator',
      prompt: { text: ACTIVITY_SYSTEM_PROMPT },
    }),
  })) as { agent: { id: string } };

  await SecureStore.setItemAsync(ACTIVITY_AGENT_ID_KEY, data.agent.id);
  return data.agent.id;
}

async function getOrCreateActivityAgent(apiKey: string) {
  await ensureActivityParserVersion();
  const existing = await SecureStore.getItemAsync(ACTIVITY_AGENT_ID_KEY);
  if (existing) {
    return { agentId: existing, isNewAgent: false };
  }

  const agentId = await createActivityAgent(apiKey);
  return { agentId, isNewAgent: true };
}

async function startCursorActivityParseRun(
  input: string,
  heightCm: number,
  weightKg: number,
  stravaActivities: StravaActivitySummary[],
  apiKey: string,
) {
  const { agentId, isNewAgent } = await getOrCreateActivityAgent(apiKey);
  const promptText = isNewAgent
    ? buildInitialActivityPrompt(input, heightCm, weightKg, stravaActivities)
    : buildFollowUpActivityPrompt(input, heightCm, weightKg, stravaActivities);

  const runData = (await cursorFetch(`/agents/${agentId}/runs`, apiKey, {
    method: 'POST',
    body: JSON.stringify({
      prompt: { text: promptText },
    }),
  })) as { run: { id: string } };

  return {
    agentId,
    runId: runData.run.id,
    apiKey,
  };
}

export type ActivityParseRunStart =
  | {
      mode: 'async';
      agentId: string;
      runId: string;
      apiKey: string;
    }
  | {
      mode: 'sync';
      resultText: string;
    };

export async function startActivityParseRun(
  input: string,
  heightCm: number,
  weightKg: number,
  stravaActivitiesJson?: string | null,
): Promise<ActivityParseRunStart> {
  const stravaActivities = parseStravaActivitiesJson(stravaActivitiesJson);
  const provider = await getAiProvider();
  const apiKey = await getStoredApiKeyForProvider(provider);

  if (!apiKey) {
    throw new Error(missingApiKeyMessage(provider));
  }

  if (provider === 'claude') {
    const resultText = await parseActivityWithClaude(
      apiKey,
      input,
      heightCm,
      weightKg,
      stravaActivities,
    );
    return { mode: 'sync', resultText };
  }

  const run = await startCursorActivityParseRun(
    input,
    heightCm,
    weightKg,
    stravaActivities,
    apiKey,
  );
  return { mode: 'async', ...run };
}

export { fetchCursorRunSnapshot as fetchRunSnapshot, runStatusError, type CursorRunStatus };

function extractActivityJson(text: string): ParsedActivityResponse {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const parsed = JSON.parse(candidate) as Record<string, unknown>;

  const bmrCalories = Math.round(Number(parsed.bmrCalories));
  const activityCalories = Math.round(Number(parsed.activityCalories));
  const totalBurnedCalories = Math.round(
    Number(parsed.totalBurnedCalories ?? bmrCalories + activityCalories),
  );
  const activityScore = Math.min(100, Math.max(0, Math.round(Number(parsed.activityScore))));
  const summary = String(parsed.summary ?? '').trim() || 'Daily activity estimate';

  if (!Number.isFinite(bmrCalories) || bmrCalories <= 0) {
    throw new Error('Parser returned an invalid BMR estimate.');
  }

  return {
    bmrCalories,
    activityCalories: Math.max(0, activityCalories),
    totalBurnedCalories: Math.max(bmrCalories, totalBurnedCalories),
    activityScore,
    summary,
  };
}

export function parseActivityRunResult(resultText: string): ParsedActivityResponse {
  return extractActivityJson(resultText);
}

export { getCursorApiKey as getStoredApiKey } from '@/services/aiProviderSettings';

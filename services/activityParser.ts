import * as SecureStore from 'expo-secure-store';

import { getStoredApiKey, fetchRunSnapshot, runStatusError } from '@/services/cursorParser';
import type { ParsedActivityResponse } from '@/types/profile';
import type { StravaActivitySummary } from '@/types/strava';
import { ACTIVITY_SCORE_EXPLANATION } from '@/utils/activityScore';
import { formatHeightCm, formatWeightKg } from '@/utils/bodyMetrics';
import { formatStravaActivitiesForPrompt, parseStravaActivitiesJson } from '@/utils/strava';

const API_BASE = 'https://api.cursor.com/v1';
const ACTIVITY_AGENT_ID_KEY = 'cursor_activity_agent_id';
const ACTIVITY_PARSER_VERSION_KEY = 'cursor_activity_parser_version';
const ACTIVITY_PARSER_VERSION = '2';

const SYSTEM_PROMPT = `You are a daily calorie expenditure estimation assistant.

Given the user's height, weight, a free-text description of what they did today (including an activity score ${ACTIVITY_SCORE_EXPLANATION}), and any Strava activities recorded that day, estimate their whole-day calorie burn.

Respond with ONLY valid JSON (no markdown, no commentary) in this exact shape:
{
  "bmrCalories": number,
  "activityCalories": number,
  "totalBurnedCalories": number,
  "activityScore": number,
  "summary": "string"
}

Rules:
- Compute BMR using Mifflin-St Jeor with the provided height and weight. Assume age 30 and sex male unless the user states otherwise.
- bmrCalories is the estimated basal metabolic rate for the full day.
- activityCalories is additional calories burned from movement/exercise beyond a sedentary day, informed by the activity description, Strava workout data when provided, and the activity score (${ACTIVITY_SCORE_EXPLANATION}).
- totalBurnedCalories must equal bmrCalories + activityCalories (round to whole numbers).
- Extract activityScore from the user's text when they provide a 0-100 value; otherwise infer a reasonable score from their description using this scale: ${ACTIVITY_SCORE_EXPLANATION}
- activityScore must be between 0 and 100.
- summary is one or two sentences explaining the estimate.
- All calorie values must be positive whole numbers.`;

const FOLLOW_UP_SUFFIX = `Respond with ONLY valid JSON (no markdown, no commentary) in the same shape as before.`;

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
      prompt: { text: SYSTEM_PROMPT },
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

function buildInitialActivityPrompt(
  input: string,
  heightCm: number,
  weightKg: number,
  stravaActivities: StravaActivitySummary[] = [],
): string {
  return `${SYSTEM_PROMPT}

User stats:
- Height: ${formatHeightCm(heightCm)} (${Math.round(heightCm)} cm)
- Weight: ${formatWeightKg(weightKg)} (${Math.round(weightKg * 10) / 10} kg)
${formatStravaActivitiesForPrompt(stravaActivities)}

Activity description:
${input}`;
}

function buildFollowUpActivityPrompt(
  input: string,
  heightCm: number,
  weightKg: number,
  stravaActivities: StravaActivitySummary[] = [],
): string {
  return `User stats:
- Height: ${formatHeightCm(heightCm)} (${Math.round(heightCm)} cm)
- Weight: ${formatWeightKg(weightKg)} (${Math.round(weightKg * 10) / 10} kg)
${formatStravaActivitiesForPrompt(stravaActivities)}

Activity description:
${input}

${FOLLOW_UP_SUFFIX}`;
}

export async function startActivityParseRun(
  input: string,
  heightCm: number,
  weightKg: number,
  stravaActivitiesJson?: string | null,
) {
  const stravaActivities = parseStravaActivitiesJson(stravaActivitiesJson);
  const apiKey = await getStoredApiKey();
  if (!apiKey) {
    throw new Error('Add your Cursor API key in Settings first.');
  }

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

export { fetchRunSnapshot, runStatusError };

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
  const activityScore = Math.min(
    100,
    Math.max(0, Math.round(Number(parsed.activityScore))),
  );
  const summary = String(parsed.summary ?? '').trim() || 'Daily activity estimate';

  if (!Number.isFinite(bmrCalories) || bmrCalories <= 0) {
    throw new Error('Cursor returned an invalid BMR estimate.');
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

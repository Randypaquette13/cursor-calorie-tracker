import {
  getAiProvider,
  getStoredApiKeyForProvider,
  missingApiKeyMessage,
  providerLabel,
} from '@/services/aiProviderSettings';
import { parseFoodWithClaude } from '@/services/claudeParser';
import {
  fetchCursorRunSnapshot,
  runStatusError,
  startCursorFoodParseRun,
  type CursorRunStatus,
} from '@/services/cursorParser';
import type { SavedFood } from '@/types/food';

export type FoodParseRunStart =
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

export async function startFoodParseRun(
  input: string,
  savedFoods: SavedFood[] = [],
): Promise<FoodParseRunStart> {
  const provider = await getAiProvider();
  const apiKey = await getStoredApiKeyForProvider(provider);

  if (!apiKey) {
    throw new Error(missingApiKeyMessage(provider));
  }

  if (provider === 'claude') {
    const resultText = await parseFoodWithClaude(apiKey, input, savedFoods);
    return { mode: 'sync', resultText };
  }

  const run = await startCursorFoodParseRun(input, savedFoods, apiKey);
  return { mode: 'async', ...run };
}

export async function pollFoodParseRun(agentId: string, runId: string, apiKey: string) {
  return fetchCursorRunSnapshot(agentId, runId, apiKey);
}

export { runStatusError, type CursorRunStatus };

export async function getActiveProviderLabel() {
  const provider = await getAiProvider();
  return providerLabel(provider);
}

export function parseTimeoutMessage(providerLabelText: string) {
  return `${providerLabelText} took too long to parse this meal. Try again.`;
}

export function missingRunInfoMessage(providerLabelText: string) {
  return `Missing ${providerLabelText} run information.`;
}

export { parseRunResult } from '@/services/cursorParser';

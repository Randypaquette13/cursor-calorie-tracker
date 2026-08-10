import * as SecureStore from 'expo-secure-store';

import { AI_PROVIDER_LABELS, type AiProvider, isAiProvider } from '@/types/aiProvider';

const PROVIDER_KEY = 'ai_provider';
const CURSOR_API_KEY = 'cursor_api_key';
const ANTHROPIC_API_KEY = 'anthropic_api_key';

const DEFAULT_PROVIDER: AiProvider = 'cursor';

export async function getAiProvider(): Promise<AiProvider> {
  const stored = await SecureStore.getItemAsync(PROVIDER_KEY);
  if (stored && isAiProvider(stored)) {
    return stored;
  }
  return DEFAULT_PROVIDER;
}

export async function saveAiProvider(provider: AiProvider) {
  await SecureStore.setItemAsync(PROVIDER_KEY, provider);
}

export async function getCursorApiKey() {
  return SecureStore.getItemAsync(CURSOR_API_KEY);
}

export async function saveCursorApiKey(apiKey: string) {
  await SecureStore.setItemAsync(CURSOR_API_KEY, apiKey.trim());
  await SecureStore.deleteItemAsync('cursor_parser_agent_id');
  await SecureStore.deleteItemAsync('cursor_activity_agent_id');
}

export async function clearCursorApiKey() {
  await SecureStore.deleteItemAsync(CURSOR_API_KEY);
  await SecureStore.deleteItemAsync('cursor_parser_agent_id');
  await SecureStore.deleteItemAsync('cursor_activity_agent_id');
}

export async function getAnthropicApiKey() {
  return SecureStore.getItemAsync(ANTHROPIC_API_KEY);
}

export async function saveAnthropicApiKey(apiKey: string) {
  await SecureStore.setItemAsync(ANTHROPIC_API_KEY, apiKey.trim());
}

export async function clearAnthropicApiKey() {
  await SecureStore.deleteItemAsync(ANTHROPIC_API_KEY);
}

export async function getStoredApiKeyForProvider(provider: AiProvider) {
  if (provider === 'claude') {
    return getAnthropicApiKey();
  }
  return getCursorApiKey();
}

export function missingApiKeyMessage(provider: AiProvider) {
  if (provider === 'claude') {
    return 'Add your Anthropic API key in Settings first.';
  }
  return 'Add your Cursor API key in Settings first.';
}

export function providerLabel(provider: AiProvider) {
  return AI_PROVIDER_LABELS[provider];
}

import {
  ACTIVITY_SYSTEM_PROMPT,
  FOOD_SYSTEM_PROMPT,
  buildInitialActivityPrompt,
  buildInitialFoodParsePrompt,
} from '@/services/parsePrompts';

const API_BASE = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-20250514';

interface AnthropicMessageResponse {
  content: Array<{ type: string; text?: string }>;
}

async function anthropicFetch(apiKey: string, body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Anthropic API error (${response.status})`);
  }

  return response.json() as Promise<AnthropicMessageResponse>;
}

function extractText(response: AnthropicMessageResponse) {
  const text = response.content
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Claude returned an empty response.');
  }

  return text;
}

async function completeWithClaude(apiKey: string, system: string, userPrompt: string) {
  const response = await anthropicFetch(apiKey, {
    model: MODEL,
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return extractText(response);
}

export async function parseFoodWithClaude(
  apiKey: string,
  input: string,
  savedFoods: Parameters<typeof buildInitialFoodParsePrompt>[1],
) {
  const prompt = buildInitialFoodParsePrompt(input, savedFoods);
  return completeWithClaude(apiKey, FOOD_SYSTEM_PROMPT, prompt);
}

export async function parseActivityWithClaude(
  apiKey: string,
  input: string,
  heightCm: number,
  weightKg: number,
  stravaActivities: Parameters<typeof buildInitialActivityPrompt>[3] = [],
) {
  const prompt = buildInitialActivityPrompt(input, heightCm, weightKg, stravaActivities);
  return completeWithClaude(apiKey, ACTIVITY_SYSTEM_PROMPT, prompt);
}

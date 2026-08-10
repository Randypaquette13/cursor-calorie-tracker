export type AiProvider = 'cursor' | 'claude';

export const AI_PROVIDERS: AiProvider[] = ['cursor', 'claude'];

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  cursor: 'Cursor',
  claude: 'Claude',
};

export function isAiProvider(value: string): value is AiProvider {
  return value === 'cursor' || value === 'claude';
}

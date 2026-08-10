import { useCallback, useEffect, useState } from 'react';

import { getAiProvider } from '@/services/aiProviderSettings';
import { AI_PROVIDER_LABELS, type AiProvider } from '@/types/aiProvider';

export function useAiProvider() {
  const [provider, setProvider] = useState<AiProvider>('cursor');

  const refresh = useCallback(async () => {
    const next = await getAiProvider();
    setProvider(next);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    provider,
    label: AI_PROVIDER_LABELS[provider],
    refresh,
  };
}

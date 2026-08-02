import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  connectStrava,
  disconnectStrava,
  fetchStravaActivitiesForDate,
  getStravaConnectionInfo,
  getStravaRedirectUri,
} from '@/services/strava';
import type { StravaActivitySummary, StravaConnectionInfo } from '@/types/strava';

interface StravaContextValue {
  connection: StravaConnectionInfo;
  redirectUri: string;
  refreshConnection: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  loadActivitiesForDate: (date: string) => Promise<StravaActivitySummary[]>;
}

const StravaContext = createContext<StravaContextValue | null>(null);

export function StravaProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = useState<StravaConnectionInfo>({
    connected: false,
    athleteName: null,
  });

  const refreshConnection = useCallback(async () => {
    setConnection(await getStravaConnectionInfo());
  }, []);

  useEffect(() => {
    void refreshConnection();
  }, [refreshConnection]);

  const connect = useCallback(async () => {
    await connectStrava();
    await refreshConnection();
  }, [refreshConnection]);

  const disconnect = useCallback(async () => {
    await disconnectStrava();
    await refreshConnection();
  }, [refreshConnection]);

  const loadActivitiesForDate = useCallback(async (date: string) => {
    const info = await getStravaConnectionInfo();
    if (!info.connected) {
      return [];
    }

    return fetchStravaActivitiesForDate(date);
  }, []);

  const value = useMemo(
    () => ({
      connection,
      redirectUri: getStravaRedirectUri(),
      refreshConnection,
      connect,
      disconnect,
      loadActivitiesForDate,
    }),
    [connect, connection, disconnect, loadActivitiesForDate, refreshConnection],
  );

  return <StravaContext.Provider value={value}>{children}</StravaContext.Provider>;
}

export function useStrava() {
  const context = useContext(StravaContext);
  if (!context) {
    throw new Error('useStrava must be used within StravaProvider');
  }
  return context;
}

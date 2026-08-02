import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  deleteWeightEntry,
  getLatestWeightEntry,
  getUserProfile,
  getWeightEntries,
  insertWeightEntry,
  saveUserHeight,
} from '@/services/database';
import type { UserProfile, WeightEntry } from '@/types/profile';

interface ProfileContextValue {
  ready: boolean;
  profile: UserProfile;
  latestWeight: WeightEntry | null;
  weightHistory: WeightEntry[];
  refresh: () => Promise<void>;
  setHeightCm: (heightCm: number) => Promise<void>;
  logWeightKg: (weightKg: number) => Promise<void>;
  removeWeightEntry: (id: number) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ heightCm: null, updatedAt: null });
  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  const refresh = useCallback(async () => {
    const [nextProfile, nextLatestWeight, nextWeightHistory] = await Promise.all([
      getUserProfile(),
      getLatestWeightEntry(),
      getWeightEntries(),
    ]);
    setProfile(nextProfile);
    setLatestWeight(nextLatestWeight);
    setWeightHistory(nextWeightHistory);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, [refresh]);

  const setHeightCm = useCallback(
    async (heightCm: number) => {
      await saveUserHeight(heightCm);
      await refresh();
    },
    [refresh],
  );

  const logWeightKg = useCallback(
    async (weightKg: number) => {
      await insertWeightEntry(weightKg);
      await refresh();
    },
    [refresh],
  );

  const removeWeightEntry = useCallback(
    async (id: number) => {
      await deleteWeightEntry(id);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      ready,
      profile,
      latestWeight,
      weightHistory,
      refresh,
      setHeightCm,
      logWeightKg,
      removeWeightEntry,
    }),
    [latestWeight, logWeightKg, profile, ready, refresh, removeWeightEntry, setHeightCm, weightHistory],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}

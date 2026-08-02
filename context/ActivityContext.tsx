import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  deleteActivityEntry,
  getActivityBurnSummaryForDate,
  getActivityEntriesForDate,
  insertActivityEntry,
} from '@/services/database';
import type { ActivityEntry, ActivityEntryInput, ActivityBurnSummary } from '@/types/profile';

export type { ActivityBurnSummary };

interface ActivityContextValue {
  entries: ActivityEntry[];
  burnSummary: ActivityBurnSummary;
  refreshForDate: (date: string) => Promise<void>;
  addActivityEntry: (entry: ActivityEntryInput) => Promise<void>;
  removeActivityEntry: (id: number) => Promise<void>;
}

const ActivityContext = createContext<ActivityContextValue | null>(null);

const emptyBurnSummary: ActivityBurnSummary = {
  totalBurned: 0,
  bmrTotal: 0,
  activityTotal: 0,
  entryCount: 0,
};

export function ActivityProvider({
  children,
  date,
  onChanged,
}: {
  children: React.ReactNode;
  date: string;
  onChanged?: () => Promise<void>;
}) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [burnSummary, setBurnSummary] = useState<ActivityBurnSummary>(emptyBurnSummary);

  const refreshForDate = useCallback(async (targetDate: string) => {
    const [nextEntries, nextSummary] = await Promise.all([
      getActivityEntriesForDate(targetDate),
      getActivityBurnSummaryForDate(targetDate),
    ]);
    setEntries(nextEntries);
    setBurnSummary(nextSummary);
  }, []);

  useEffect(() => {
    void refreshForDate(date);
  }, [date, refreshForDate]);

  const addActivityEntry = useCallback(
    async (entry: ActivityEntryInput) => {
      await insertActivityEntry(entry);
      await refreshForDate(entry.date);
      await onChanged?.();
    },
    [onChanged, refreshForDate],
  );

  const removeActivityEntry = useCallback(
    async (id: number) => {
      await deleteActivityEntry(id);
      await refreshForDate(date);
      await onChanged?.();
    },
    [date, onChanged, refreshForDate],
  );

  const value = useMemo(
    () => ({
      entries,
      burnSummary,
      refreshForDate,
      addActivityEntry,
      removeActivityEntry,
    }),
    [addActivityEntry, burnSummary, entries, refreshForDate, removeActivityEntry],
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within ActivityProvider');
  }
  return context;
}

export function useActivityOptional() {
  return useContext(ActivityContext);
}

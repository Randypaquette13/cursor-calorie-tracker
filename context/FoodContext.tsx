import { format } from 'date-fns';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  deleteFoodEntry,
  getDailySummary,
  getEntriesForDate,
  getHistorySummaries,
  initDatabase,
  insertFoodEntry,
} from '@/services/database';
import type { DailySummary, FoodEntry, FoodSource, MealType } from '@/types/food';

interface FoodContextValue {
  ready: boolean;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  today: string;
  entries: FoodEntry[];
  summary: DailySummary;
  history: DailySummary[];
  refresh: () => Promise<void>;
  addEntry: (entry: {
    mealType: MealType;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    source: FoodSource;
    rawInput?: string | null;
    barcode?: string | null;
    date?: string;
  }) => Promise<void>;
  removeEntry: (id: number) => Promise<void>;
}

const FoodContext = createContext<FoodContextValue | null>(null);

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [ready, setReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [summary, setSummary] = useState<DailySummary>({
    date: today,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    entryCount: 0,
  });
  const [history, setHistory] = useState<DailySummary[]>([]);

  const refresh = useCallback(async () => {
    const [dayEntries, daySummary, historySummaries] = await Promise.all([
      getEntriesForDate(selectedDate),
      getDailySummary(selectedDate),
      getHistorySummaries(),
    ]);
    setEntries(dayEntries);
    setSummary(daySummary);
    setHistory(historySummaries);
  }, [selectedDate]);

  useEffect(() => {
    (async () => {
      await initDatabase();
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    refresh();
  }, [ready, refresh]);

  const addEntry = useCallback(
    async (entry: {
      mealType: MealType;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      source: FoodSource;
      rawInput?: string | null;
      barcode?: string | null;
      date?: string;
    }) => {
      await insertFoodEntry({
        ...entry,
        date: entry.date ?? selectedDate,
      });
      await refresh();
    },
    [refresh, selectedDate],
  );

  const removeEntry = useCallback(
    async (id: number) => {
      await deleteFoodEntry(id);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      ready,
      selectedDate,
      setSelectedDate,
      today,
      entries,
      summary,
      history,
      refresh,
      addEntry,
      removeEntry,
    }),
    [ready, selectedDate, today, entries, summary, history, refresh, addEntry, removeEntry],
  );

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}

export function useFood() {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFood must be used within FoodProvider');
  }
  return context;
}

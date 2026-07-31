import { format } from 'date-fns';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  deleteFoodEntry,
  getDailySummary,
  getEntriesForDate,
  getHistorySummaries,
  initDatabase,
  insertFoodEntry,
  insertFoodEntries,
  updateFoodEntry,
} from '@/services/database';
import type { DailySummary, FoodEntry, FoodEntryInput, MealType } from '@/types/food';

interface FoodContextValue {
  ready: boolean;
  today: string;
  todayEntries: FoodEntry[];
  todaySummary: DailySummary;
  historySelectedDate: string;
  setHistorySelectedDate: (date: string) => void;
  historyEntries: FoodEntry[];
  historySummary: DailySummary;
  history: DailySummary[];
  refresh: () => Promise<void>;
  addEntry: (entry: FoodEntryInput) => Promise<void>;
  addEntries: (entries: FoodEntryInput[], options?: { rawInput?: string | null }) => Promise<void>;
  editEntry: (
    id: number,
    entry: {
      mealType: MealType;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      caloriesMin: number;
      caloriesMax: number;
      proteinMin: number;
      proteinMax: number;
      carbsMin: number;
      carbsMax: number;
      fatMin: number;
      fatMax: number;
    },
  ) => Promise<void>;
  removeEntry: (id: number) => Promise<void>;
}

const FoodContext = createContext<FoodContextValue | null>(null);

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [ready, setReady] = useState(false);
  const [historySelectedDate, setHistorySelectedDate] = useState(today);
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [todaySummary, setTodaySummary] = useState<DailySummary>({
    date: today,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    caloriesMin: 0,
    caloriesMax: 0,
    proteinMin: 0,
    proteinMax: 0,
    carbsMin: 0,
    carbsMax: 0,
    fatMin: 0,
    fatMax: 0,
    entryCount: 0,
  });
  const [historyEntries, setHistoryEntries] = useState<FoodEntry[]>([]);
  const [historySummary, setHistorySummary] = useState<DailySummary>({
    date: today,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    caloriesMin: 0,
    caloriesMax: 0,
    proteinMin: 0,
    proteinMax: 0,
    carbsMin: 0,
    carbsMax: 0,
    fatMin: 0,
    fatMax: 0,
    entryCount: 0,
  });
  const [history, setHistory] = useState<DailySummary[]>([]);

  const refresh = useCallback(async () => {
    const [
      currentDayEntries,
      currentDaySummary,
      selectedDayEntries,
      selectedDaySummary,
      historySummaries,
    ] = await Promise.all([
      getEntriesForDate(today),
      getDailySummary(today),
      getEntriesForDate(historySelectedDate),
      getDailySummary(historySelectedDate),
      getHistorySummaries(),
    ]);

    setTodayEntries(currentDayEntries);
    setTodaySummary(currentDaySummary);
    setHistoryEntries(selectedDayEntries);
    setHistorySummary(selectedDaySummary);
    setHistory(historySummaries);
  }, [historySelectedDate, today]);

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
    async (entry: FoodEntryInput) => {
      await insertFoodEntry({
        ...entry,
        date: today,
      });
      await refresh();
    },
    [refresh, today],
  );

  const addEntries = useCallback(
    async (entries: FoodEntryInput[], options?: { rawInput?: string | null }) => {
      if (entries.length === 0) return;
      if (entries.length === 1) {
        await insertFoodEntry({
          ...entries[0],
          date: today,
          rawInput: entries[0].rawInput ?? options?.rawInput ?? null,
        });
      } else {
        await insertFoodEntries(today, entries, options);
      }
      await refresh();
    },
    [refresh, today],
  );

  const editEntry = useCallback(
    async (
      id: number,
      entry: {
        mealType: MealType;
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        caloriesMin: number;
        caloriesMax: number;
        proteinMin: number;
        proteinMax: number;
        carbsMin: number;
        carbsMax: number;
        fatMin: number;
        fatMax: number;
      },
    ) => {
      await updateFoodEntry(id, entry);
      await refresh();
    },
    [refresh],
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
      today,
      todayEntries,
      todaySummary,
      historySelectedDate,
      setHistorySelectedDate,
      historyEntries,
      historySummary,
      history,
      refresh,
      addEntry,
      addEntries,
      editEntry,
      removeEntry,
    }),
    [
      ready,
      today,
      todayEntries,
      todaySummary,
      historySelectedDate,
      historyEntries,
      historySummary,
      history,
      refresh,
      addEntry,
      addEntries,
      editEntry,
      removeEntry,
    ],
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

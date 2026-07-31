import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  deleteSavedFood,
  getSavedFoods,
  insertSavedFood,
  updateSavedFood,
} from '@/services/database';
import type { SavedFood } from '@/types/food';

export interface SavedFoodInput {
  name: string;
  description: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}

interface SavedFoodsContextValue {
  foods: SavedFood[];
  ready: boolean;
  refresh: () => Promise<void>;
  addFood: (input: SavedFoodInput) => Promise<void>;
  editFood: (id: number, input: SavedFoodInput) => Promise<void>;
  removeFood: (id: number) => Promise<void>;
}

const SavedFoodsContext = createContext<SavedFoodsContextValue | null>(null);

export function SavedFoodsProvider({ children }: { children: React.ReactNode }) {
  const [foods, setFoods] = useState<SavedFood[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const items = await getSavedFoods();
    setFoods(items);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, [refresh]);

  const addFood = useCallback(
    async (input: SavedFoodInput) => {
      await insertSavedFood(input);
      await refresh();
    },
    [refresh],
  );

  const editFood = useCallback(
    async (id: number, input: SavedFoodInput) => {
      await updateSavedFood(id, input);
      await refresh();
    },
    [refresh],
  );

  const removeFood = useCallback(
    async (id: number) => {
      await deleteSavedFood(id);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({ foods, ready, refresh, addFood, editFood, removeFood }),
    [foods, ready, refresh, addFood, editFood, removeFood],
  );

  return <SavedFoodsContext.Provider value={value}>{children}</SavedFoodsContext.Provider>;
}

export function useSavedFoods() {
  const context = useContext(SavedFoodsContext);
  if (!context) {
    throw new Error('useSavedFoods must be used within SavedFoodsProvider');
  }
  return context;
}

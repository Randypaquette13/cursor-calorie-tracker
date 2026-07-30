import type { DailySummary, FoodEntry, FoodSource, MealType } from '@/types/food';

const unsupported = (): never => {
  throw new Error('SQLite is only available in Expo Go on iOS and Android.');
};

export async function initDatabase() {}

export async function insertFoodEntry(_entry: {
  date: string;
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: FoodSource;
  rawInput?: string | null;
  barcode?: string | null;
}): Promise<FoodEntry> {
  return unsupported();
}

export async function getEntriesForDate(_date: string): Promise<FoodEntry[]> {
  return [];
}

export async function getDailySummary(date: string): Promise<DailySummary> {
  return { date, calories: 0, protein: 0, carbs: 0, fat: 0, entryCount: 0 };
}

export async function getHistorySummaries(_limit = 90): Promise<DailySummary[]> {
  return [];
}

export async function deleteFoodEntry(_id: number) {
  unsupported();
}

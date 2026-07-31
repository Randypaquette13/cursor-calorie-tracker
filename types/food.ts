export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'unknown';

export type FoodSource = 'natural_language' | 'barcode';

export interface FoodEntry {
  id: number;
  date: string;
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: FoodSource;
  rawInput: string | null;
  barcode: string | null;
  logGroupId: string | null;
  createdAt: string;
}

export interface FoodEntryInput {
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: FoodSource;
  rawInput?: string | null;
  barcode?: string | null;
}

export interface DailySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entryCount: number;
}

export interface ParsedFoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType?: MealType | null;
}

export interface ParsedFoodResponse {
  items: ParsedFoodItem[];
}

export interface SavedFood {
  id: number;
  name: string;
  description: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  createdAt: string;
  updatedAt: string;
}

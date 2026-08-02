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
  caloriesMin: number | null;
  caloriesMax: number | null;
  proteinMin: number | null;
  proteinMax: number | null;
  carbsMin: number | null;
  carbsMax: number | null;
  fatMin: number | null;
  fatMax: number | null;
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
  caloriesMin?: number | null;
  caloriesMax?: number | null;
  proteinMin?: number | null;
  proteinMax?: number | null;
  carbsMin?: number | null;
  carbsMax?: number | null;
  fatMin?: number | null;
  fatMax?: number | null;
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
  caloriesMin: number;
  caloriesMax: number;
  proteinMin: number;
  proteinMax: number;
  carbsMin: number;
  carbsMax: number;
  fatMin: number;
  fatMax: number;
  entryCount: number;
  activityBurn: number;
  activityEntryCount: number;
}

export interface ParsedFoodItem {
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

export type ParseJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface ParseJob {
  id: number;
  date: string;
  rawInput: string;
  status: ParseJobStatus;
  agentId: string | null;
  runId: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

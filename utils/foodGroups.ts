import type { FoodEntry } from '@/types/food';
import { effectiveNutrition } from '@/utils/nutrition';

export interface FoodLogGroup {
  id: string;
  entries: FoodEntry[];
  createdAt: string;
  isMulti: boolean;
}

export interface GroupNutritionTotals {
  calories: number;
  caloriesMin: number;
  caloriesMax: number;
  protein: number;
  proteinMin: number;
  proteinMax: number;
  carbs: number;
  carbsMin: number;
  carbsMax: number;
  fat: number;
  fatMin: number;
  fatMax: number;
}

export function groupFoodEntries(entries: FoodEntry[]): FoodLogGroup[] {
  const groups = new Map<string, FoodEntry[]>();

  for (const entry of entries) {
    const key = entry.logGroupId ?? `solo-${entry.id}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }

  return Array.from(groups.entries())
    .map(([id, groupEntries]) => ({
      id,
      entries: groupEntries,
      createdAt: groupEntries[0].createdAt,
      isMulti: groupEntries.length > 1,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function sumGroupNutrition(entries: FoodEntry[]): GroupNutritionTotals {
  return entries.reduce<GroupNutritionTotals>(
    (totals, entry) => {
      const scaled = effectiveNutrition(entry);
      return {
        calories: totals.calories + scaled.calories,
        caloriesMin: totals.caloriesMin + scaled.caloriesMin,
        caloriesMax: totals.caloriesMax + scaled.caloriesMax,
        protein: totals.protein + scaled.protein,
        proteinMin: totals.proteinMin + scaled.proteinMin,
        proteinMax: totals.proteinMax + scaled.proteinMax,
        carbs: totals.carbs + scaled.carbs,
        carbsMin: totals.carbsMin + scaled.carbsMin,
        carbsMax: totals.carbsMax + scaled.carbsMax,
        fat: totals.fat + scaled.fat,
        fatMin: totals.fatMin + scaled.fatMin,
        fatMax: totals.fatMax + scaled.fatMax,
      };
    },
    {
      calories: 0,
      caloriesMin: 0,
      caloriesMax: 0,
      protein: 0,
      proteinMin: 0,
      proteinMax: 0,
      carbs: 0,
      carbsMin: 0,
      carbsMax: 0,
      fat: 0,
      fatMin: 0,
      fatMax: 0,
    },
  );
}

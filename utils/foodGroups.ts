import type { FoodEntry } from '@/types/food';

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
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      caloriesMin: totals.caloriesMin + (entry.caloriesMin ?? entry.calories),
      caloriesMax: totals.caloriesMax + (entry.caloriesMax ?? entry.calories),
      protein: totals.protein + entry.protein,
      proteinMin: totals.proteinMin + (entry.proteinMin ?? entry.protein),
      proteinMax: totals.proteinMax + (entry.proteinMax ?? entry.protein),
      carbs: totals.carbs + entry.carbs,
      carbsMin: totals.carbsMin + (entry.carbsMin ?? entry.carbs),
      carbsMax: totals.carbsMax + (entry.carbsMax ?? entry.carbs),
      fat: totals.fat + entry.fat,
      fatMin: totals.fatMin + (entry.fatMin ?? entry.fat),
      fatMax: totals.fatMax + (entry.fatMax ?? entry.fat),
    }),
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

import type { FoodEntry } from '@/types/food';

export interface FoodLogGroup {
  id: string;
  entries: FoodEntry[];
  createdAt: string;
  isMulti: boolean;
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

export function sumGroupCalories(entries: FoodEntry[]) {
  return entries.reduce((total, entry) => total + entry.calories, 0);
}

export function sumGroupMacros(entries: FoodEntry[]) {
  return entries.reduce(
    (totals, entry) => ({
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );
}

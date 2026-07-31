import { isVaguePortion } from '@/utils/vaguePortion';

export interface NutritionBounds {
  min: number | null;
  max: number | null;
}

export function midpoint(min: number, max: number) {
  return (min + max) / 2;
}

export function hasNutritionRange(min: number | null, max: number | null) {
  if (min == null || max == null) return false;
  return Math.round(min) !== Math.round(max);
}

export function formatCaloriesEstimate(point: number) {
  return `${Math.round(point)} kcal`;
}

export function formatMacroEstimate(point: number) {
  return `${Math.round(point)}g`;
}

export function formatRangeBand(min: number | null, max: number | null, unit = '') {
  if (!hasNutritionRange(min, max)) return null;
  return `${Math.round(min!)}-${Math.round(max!)}${unit}`;
}

export function formatCaloriesRange(min: number | null, max: number | null) {
  const band = formatRangeBand(min, max);
  return band ? `${band} kcal` : null;
}

export function formatMacroRange(min: number | null, max: number | null) {
  return formatRangeBand(min, max, 'g');
}

export function expandExactRange(point: number, spread = 0.25) {
  if (point <= 0) {
    return { point: 0, min: 0, max: 0 };
  }
  const delta = point * spread;
  return {
    point,
    min: Math.max(0, Math.round(point - delta)),
    max: Math.round(point + delta),
  };
}

export function nutritionFieldFromRecord(record: Record<string, unknown>, base: string) {
  const minKey = `${base}Min`;
  const maxKey = `${base}Max`;

  if (record[minKey] != null || record[maxKey] != null) {
    return normalizeNutritionField({
      min: record[minKey],
      max: record[maxKey] ?? record[minKey],
    });
  }

  return normalizeNutritionField(record[base]);
}

export function applyVagueRangeFallback<T extends {
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
}>(item: T, input: string): T {
  if (!isVaguePortion(input)) {
    return item;
  }

  const maybeExpand = (point: number, min: number, max: number) => {
    if (hasNutritionRange(min, max)) {
      return { point, min, max };
    }
    return expandExactRange(point);
  };

  const calories = maybeExpand(item.calories, item.caloriesMin, item.caloriesMax);
  const protein = maybeExpand(item.protein, item.proteinMin, item.proteinMax);
  const carbs = maybeExpand(item.carbs, item.carbsMin, item.carbsMax);
  const fat = maybeExpand(item.fat, item.fatMin, item.fatMax);

  return {
    ...item,
    calories: calories.point,
    protein: protein.point,
    carbs: carbs.point,
    fat: fat.point,
    caloriesMin: calories.min,
    caloriesMax: calories.max,
    proteinMin: protein.min,
    proteinMax: protein.max,
    carbsMin: carbs.min,
    carbsMax: carbs.max,
    fatMin: fat.min,
    fatMax: fat.max,
  };
}


export function normalizeNutritionField(value: unknown): {
  point: number;
  min: number;
  max: number;
} {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { point: value, min: value, max: value };
  }

  if (value && typeof value === 'object') {
    const record = value as { min?: unknown; max?: unknown; value?: unknown };
    if (record.min != null || record.max != null) {
      const min = Number(record.min) || 0;
      const max = Number(record.max ?? record.min) || min;
      const low = Math.min(min, max);
      const high = Math.max(min, max);
      return { point: midpoint(low, high), min: low, max: high };
    }
    if (record.value != null) {
      const exact = Number(record.value) || 0;
      return { point: exact, min: exact, max: exact };
    }
  }

  const exact = Number(value) || 0;
  return { point: exact, min: exact, max: exact };
}

export function exactNutrition(values: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  return {
    ...values,
    caloriesMin: values.calories,
    caloriesMax: values.calories,
    proteinMin: values.protein,
    proteinMax: values.protein,
    carbsMin: values.carbs,
    carbsMax: values.carbs,
    fatMin: values.fat,
    fatMax: values.fat,
  };
}

export function formatMacroLine(entry: {
  calories?: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  const parts = [
    entry.calories != null ? formatCaloriesEstimate(entry.calories) : null,
    `P ${formatMacroEstimate(entry.protein)}`,
    `C ${formatMacroEstimate(entry.carbs)}`,
    `F ${formatMacroEstimate(entry.fat)}`,
  ].filter(Boolean);

  return parts.join(' · ');
}

export function formatFullNutrition(entry: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  return formatMacroLine(entry);
}

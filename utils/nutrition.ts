export interface NutritionBounds {
  min: number | null;
  max: number | null;
}

export function isNutritionRange(min: number | null, max: number | null, point: number) {
  if (min == null || max == null) return false;
  return Math.round(min) !== Math.round(max) && Math.round(min) !== Math.round(point);
}

export function formatNutritionAmount(
  point: number,
  min: number | null,
  max: number | null,
  unit = '',
) {
  if (min != null && max != null && Math.round(min) !== Math.round(max)) {
    return `${Math.round(min)}-${Math.round(max)}${unit}`;
  }
  return `${Math.round(point)}${unit}`;
}

export function formatCalories(point: number, min: number | null, max: number | null) {
  return `${formatNutritionAmount(point, min, max)} kcal`;
}

export function formatMacro(point: number, min: number | null, max: number | null) {
  return `${formatNutritionAmount(point, min, max)}g`;
}

export function midpoint(min: number, max: number) {
  return (min + max) / 2;
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
  protein: number;
  carbs: number;
  fat: number;
  proteinMin: number | null;
  proteinMax: number | null;
  carbsMin: number | null;
  carbsMax: number | null;
  fatMin: number | null;
  fatMax: number | null;
}) {
  const protein = formatMacro(
    entry.protein,
    entry.proteinMin ?? entry.protein,
    entry.proteinMax ?? entry.protein,
  );
  const carbs = formatMacro(entry.carbs, entry.carbsMin ?? entry.carbs, entry.carbsMax ?? entry.carbs);
  const fat = formatMacro(entry.fat, entry.fatMin ?? entry.fat, entry.fatMax ?? entry.fat);
  return `P ${protein} · C ${carbs} · F ${fat}`;
}

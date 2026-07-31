export interface NutritionBounds {
  min: number | null;
  max: number | null;
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

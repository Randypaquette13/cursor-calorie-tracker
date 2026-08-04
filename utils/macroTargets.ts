import { kgToLbs } from '@/utils/bodyMetrics';
import type { ActivityBurnSummary } from '@/types/profile';

const DEFAULT_AGE = 30;
const FAT_CALORIE_SHARE = 0.28;

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  basis: 'bmr' | 'activity';
}

/** Mifflin-St Jeor BMR (male, age 30) — matches activity parser defaults. */
export function computeBmrCalories(weightKg: number, heightCm: number, age = DEFAULT_AGE): number {
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
}

export function computeMacroTargets(params: {
  heightCm: number | null;
  weightKg: number | null;
  activityBurn?: ActivityBurnSummary | null;
}): MacroTargets | null {
  const { heightCm, weightKg, activityBurn } = params;
  if (heightCm == null || heightCm <= 0 || weightKg == null || weightKg <= 0) {
    return null;
  }

  const bmr = computeBmrCalories(weightKg, heightCm);
  const hasActivity = (activityBurn?.entryCount ?? 0) > 0 && (activityBurn?.totalBurned ?? 0) > 0;
  const calorieTarget = hasActivity ? Math.round(activityBurn!.totalBurned) : bmr;

  let protein = Math.round(kgToLbs(weightKg));
  let fat = Math.round((calorieTarget * FAT_CALORIE_SHARE) / 9);

  let proteinCalories = protein * 4;
  let fatCalories = fat * 9;

  if (proteinCalories + fatCalories > calorieTarget * 0.85) {
    protein = Math.round((calorieTarget * 0.3) / 4);
    fat = Math.round((calorieTarget * 0.25) / 9);
    proteinCalories = protein * 4;
    fatCalories = fat * 9;
  }

  const carbs = Math.max(0, Math.round((calorieTarget - proteinCalories - fatCalories) / 4));

  return {
    calories: calorieTarget,
    protein,
    carbs,
    fat,
    basis: hasActivity ? 'activity' : 'bmr',
  };
}

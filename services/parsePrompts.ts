import { ACTIVITY_SCORE_EXPLANATION } from '@/utils/activityScore';
import { formatHeightCm, formatWeightKg } from '@/utils/bodyMetrics';
import { formatStravaActivitiesForPrompt } from '@/utils/strava';
import type { SavedFood } from '@/types/food';
import type { StravaActivitySummary } from '@/types/strava';

export const FOOD_SYSTEM_PROMPT = `You are a nutrition estimation assistant. Given a natural-language food description, estimate calories and macros.

Respond with ONLY valid JSON (no markdown, no commentary) in this exact shape:
{
  "items": [
    {
      "name": "string",
      "calories": { "min": number, "max": number },
      "protein": { "min": number, "max": number },
      "carbs": { "min": number, "max": number },
      "fat": { "min": number, "max": number },
      "mealType": "breakfast" | "lunch" | "dinner" | "snack" | null
    }
  ]
}

Rules:
- Split multi-item meals into separate items when possible.
- Infer mealType from words like breakfast/lunch/dinner/snack, otherwise null.
- WEIGHED portions (grams, oz, lb, kg explicitly stated for that item): set min and max equal or within ~3% — the user measured mass.
- WEIGHED but COMPOSITE/HOMEMADE (e.g. "200g of my chili", "150g homemade curry"): use a small range (~10%) because ingredient ratios are uncertain even when total weight is known.
- NOT WEIGHED: default to a range with min lower than max. This includes cups, bowls, plates, "some", "a serving", restaurant portions, and any item without a scale weight.
- Count-based items without weight (e.g. "2 eggs"): small range (~10%) is OK.
- Volume measures without weight (cups, tbsp): moderate range (~15-25%).
- Vague amounts ("some rice", "handful of nuts"): wider range (~25-40%).
- All min/max values must be numbers with min <= max.
- When the user mentions a saved food by name (exact or close match), use that food's description and known nutrition instead of guessing; use exact values (min = max) when saved nutrition is known.`;

export const FOOD_FOLLOW_UP_SUFFIX = `Respond with ONLY valid JSON (no markdown, no commentary) in the same shape as before.`;

export const ACTIVITY_SYSTEM_PROMPT = `You are a daily calorie expenditure estimation assistant.

Given the user's height, weight, a free-text description of what they did today (including an activity score ${ACTIVITY_SCORE_EXPLANATION}), and any Strava activities recorded that day, estimate their whole-day calorie burn.

Respond with ONLY valid JSON (no markdown, no commentary) in this exact shape:
{
  "bmrCalories": number,
  "activityCalories": number,
  "totalBurnedCalories": number,
  "activityScore": number,
  "summary": "string"
}

Rules:
- Compute BMR using Mifflin-St Jeor with the provided height and weight. Assume age 30 and sex male unless the user states otherwise.
- bmrCalories is the estimated basal metabolic rate for the full day.
- activityCalories is additional calories burned from movement/exercise beyond a sedentary day, informed by the activity description, Strava workout data when provided, and the activity score (${ACTIVITY_SCORE_EXPLANATION}).
- totalBurnedCalories must equal bmrCalories + activityCalories (round to whole numbers).
- Extract activityScore from the user's text when they provide a 0-100 value; otherwise infer a reasonable score from their description using this scale: ${ACTIVITY_SCORE_EXPLANATION}
- activityScore must be between 0 and 100.
- summary is one or two sentences explaining the estimate.
- All calorie values must be positive whole numbers.`;

export const ACTIVITY_FOLLOW_UP_SUFFIX = `Respond with ONLY valid JSON (no markdown, no commentary) in the same shape as before.`;

function formatSavedFoodsForPrompt(savedFoods: SavedFood[]): string {
  if (savedFoods.length === 0) return '';

  const lines = savedFoods.map((food) => {
    const known =
      food.calories != null
        ? ` Known nutrition: ${Math.round(food.calories)} cal, P ${Math.round(food.protein ?? 0)}g, C ${Math.round(food.carbs ?? 0)}g, F ${Math.round(food.fat ?? 0)}g.`
        : '';
    return `- "${food.name}": ${food.description}.${known}`;
  });

  return `\n\nThe user has saved these personal foods. When their input matches or refers to a saved food name, use that food's description and known nutrition (when provided) instead of guessing:\n${lines.join('\n')}`;
}

export function buildInitialFoodParsePrompt(input: string, savedFoods: SavedFood[]): string {
  return `${FOOD_SYSTEM_PROMPT}${formatSavedFoodsForPrompt(savedFoods)}\n\nFood description: ${input}`;
}

export function buildFollowUpFoodParsePrompt(input: string, savedFoods: SavedFood[]): string {
  return `${formatSavedFoodsForPrompt(savedFoods)}\n\nFood description: ${input}\n\n${FOOD_FOLLOW_UP_SUFFIX}`;
}

export function buildInitialActivityPrompt(
  input: string,
  heightCm: number,
  weightKg: number,
  stravaActivities: StravaActivitySummary[] = [],
): string {
  return `${ACTIVITY_SYSTEM_PROMPT}

User stats:
- Height: ${formatHeightCm(heightCm)} (${Math.round(heightCm)} cm)
- Weight: ${formatWeightKg(weightKg)} (${Math.round(weightKg * 10) / 10} kg)
${formatStravaActivitiesForPrompt(stravaActivities)}

Activity description:
${input}`;
}

export function buildFollowUpActivityPrompt(
  input: string,
  heightCm: number,
  weightKg: number,
  stravaActivities: StravaActivitySummary[] = [],
): string {
  return `User stats:
- Height: ${formatHeightCm(heightCm)} (${Math.round(heightCm)} cm)
- Weight: ${formatWeightKg(weightKg)} (${Math.round(weightKg * 10) / 10} kg)
${formatStravaActivitiesForPrompt(stravaActivities)}

Activity description:
${input}

${ACTIVITY_FOLLOW_UP_SUFFIX}`;
}

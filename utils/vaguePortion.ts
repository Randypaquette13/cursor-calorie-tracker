const VAGUE_PORTION_PATTERN =
  /\b(some|a bit|bit of|handful|scoop|bowl|plate|serving|small|large|few|couple|several|around|about|roughly|approximately|slice|piece|drizzle|splash|leftover|leftovers)\b/i;

const EXACT_PORTION_PATTERN =
  /\b\d+(\.\d+)?\s*(g|gram|grams|oz|ounce|ounces|lb|lbs|cup|cups|tbsp|tsp|ml|l|slice|slices|egg|eggs|piece|pieces)\b|\b\d+\s+\w+/i;

export function isVaguePortion(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (EXACT_PORTION_PATTERN.test(trimmed)) return false;
  return VAGUE_PORTION_PATTERN.test(trimmed);
}

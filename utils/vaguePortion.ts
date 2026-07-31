export type PortionConfidence =
  | 'weighed'
  | 'weighed_composite'
  | 'count'
  | 'volume'
  | 'composite'
  | 'unspecified';

const WEIGHT_PATTERN =
  /\b\d+(\.\d+)?\s*(g|gram|grams|kg|kilogram|kilograms|oz|ounce|ounces|lb|lbs|pound|pounds)\b/i;

const COUNT_PATTERN =
  /\b\d+(\.\d+)?\s+(egg|eggs|slice|slices|piece|pieces|strip|strips|wing|wings|cookie|cookies|cracker|crackers|meatball|meatballs|nugget|nuggets|sausage|sausages|waffle|waffles|pancake|pancakes|tortilla|tortillas)\b/i;

const VOLUME_PATTERN =
  /\b\d+(\.\d+)?\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|ml|milliliter|milliliters|l|liter|liters|fl\s?oz)\b/i;

const COMPOSITE_PATTERN =
  /\b(homemade|recipe|casserole|stew|chili|curry|salad|sandwich|burger|pizza|pasta|bowl|plate|meal|leftover|leftovers|usual|smoothie|shake|soup|stir fry|stir-fry|burrito|wrap|combo|mixed|plate of)\b/i;

const VAGUE_AMOUNT_PATTERN =
  /\b(some|a bit|bit of|handful|scoop|small|large|few|couple|several|around|about|roughly|approximately|drizzle|splash|half)\b/i;

function getItemPortionClause(itemName: string, input: string) {
  const segments = input
    .split(/\band\b|,|;|\+|\n|\//i)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const itemWords = itemName
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length > 2);

  const matchingSegment = segments.find((segment) => {
    const lower = segment.toLowerCase();
    return itemWords.some((word) => lower.includes(word));
  });

  return matchingSegment ?? input;
}

export function classifyPortion(itemName: string, input: string): PortionConfidence {
  const clause = getItemPortionClause(itemName, input);
  const composite =
    COMPOSITE_PATTERN.test(clause) ||
    COMPOSITE_PATTERN.test(itemName) ||
    VAGUE_AMOUNT_PATTERN.test(clause);
  const hasWeight = WEIGHT_PATTERN.test(clause);

  if (hasWeight && composite) {
    return 'weighed_composite';
  }
  if (hasWeight) {
    return 'weighed';
  }
  if (composite) {
    return 'composite';
  }
  if (COUNT_PATTERN.test(clause)) {
    return 'count';
  }
  if (VOLUME_PATTERN.test(clause)) {
    return 'volume';
  }
  return 'unspecified';
}

export function spreadForPortion(confidence: PortionConfidence) {
  switch (confidence) {
    case 'weighed':
      return 0;
    case 'weighed_composite':
      return 0.08;
    case 'count':
      return 0.08;
    case 'volume':
      return 0.18;
    case 'composite':
      return 0.3;
    case 'unspecified':
    default:
      return 0.3;
  }
}

export function getPortionSpread(itemName: string, input: string) {
  return spreadForPortion(classifyPortion(itemName, input));
}

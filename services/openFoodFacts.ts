import type { ParsedFoodItem } from '@/types/food';

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
  };
  serving_size?: string;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

function pickNumber(...values: Array<number | undefined>) {
  for (const value of values) {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return Math.round(value);
    }
  }
  return 0;
}

export async function lookupBarcode(barcode: string): Promise<ParsedFoodItem> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
  );

  if (!response.ok) {
    throw new Error('Could not reach Open Food Facts.');
  }

  const data = (await response.json()) as OpenFoodFactsResponse;
  if (data.status !== 1 || !data.product) {
    throw new Error('Product not found in Open Food Facts.');
  }

  const product = data.product;
  const nameParts = [product.product_name, product.brands].filter(Boolean);
  const name = nameParts.join(' — ') || `Barcode ${barcode}`;

  return {
    name,
    calories: pickNumber(
      product.nutriments?.['energy-kcal_serving'],
      product.nutriments?.['energy-kcal_100g'],
    ),
    protein: pickNumber(
      product.nutriments?.proteins_serving,
      product.nutriments?.proteins_100g,
    ),
    carbs: pickNumber(
      product.nutriments?.carbohydrates_serving,
      product.nutriments?.carbohydrates_100g,
    ),
    fat: pickNumber(product.nutriments?.fat_serving, product.nutriments?.fat_100g),
  };
}

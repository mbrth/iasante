/**
 * Open Food Facts API - Scan codes-barres pour infos nutritionnelles
 * https://world.openfoodfacts.org/
 */

const API_BASE = 'https://world.openfoodfacts.net/api/v2';
const FIELDS = 'product_name,nutriments,nutrition_grades,image_url,image_small_url,quantity';

export interface OFFProduct {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  sugar: number;
  img: string;
  grade?: string;
  quantity?: string;
  /** Valeurs par 100g pour calcul portion */
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
    sugar: number;
  };
}

function toNumber(val: unknown): number {
  if (val == null) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/** Sodium en g dans l'API → on veut mg. 1g = 1000mg */
function sodiumToMg(sodiumG: number): number {
  return Math.round(sodiumG * 1000);
}

export async function fetchProductByBarcode(barcode: string): Promise<OFFProduct | null> {
  const code = String(barcode).trim().replace(/\D/g, '');
  if (code.length < 8) return null;

  const res = await fetch(`${API_BASE}/product/${code}?fields=${FIELDS}`, {
    headers: { 'User-Agent': 'NutriPathAI/1.0 (Nutrition App)' },
  });
  const json = await res.json();

  if (json.status !== 1 || !json.product) return null;

  const p = json.product;
  const nut = p.nutriments || {};

  const calories100 = toNumber(nut['energy-kcal_100g']) || toNumber(nut['energy-kcal']) || 0;
  const protein100 = toNumber(nut.proteins_100g) || toNumber(nut.proteins) || 0;
  const carbs100 = toNumber(nut.carbohydrates_100g) || toNumber(nut.carbohydrates) || 0;
  const fat100 = toNumber(nut.fat_100g) || toNumber(nut.fat) || 0;
  const sodium100g = toNumber(nut.sodium_100g) ?? toNumber(nut.sodium) ?? 0;
  const sugar100 = toNumber(nut.sugars_100g) || toNumber(nut.sugars) || 0;

  const per100g = {
    calories: calories100,
    protein: protein100,
    carbs: carbs100,
    fat: fat100,
    sodium: sodiumToMg(sodium100g),
    sugar: sugar100,
  };

  return {
    name: p.product_name || 'Produit inconnu',
    calories: calories100,
    protein: protein100,
    carbs: carbs100,
    fat: fat100,
    sodium: sodiumToMg(sodium100g),
    sugar: sugar100,
    img: p.image_small_url || p.image_url || '',
    grade: p.nutrition_grades,
    quantity: p.quantity,
    per100g,
  };
}

/** Calcule les valeurs pour une portion en grammes */
export function scaleProduct(product: OFFProduct, grams: number): Omit<OFFProduct, 'per100g'> {
  const ratio = grams / 100;
  return {
    name: product.name,
    calories: Math.round(product.per100g.calories * ratio),
    protein: Math.round(product.per100g.protein * ratio * 10) / 10,
    carbs: Math.round(product.per100g.carbs * ratio * 10) / 10,
    fat: Math.round(product.per100g.fat * ratio * 10) / 10,
    sodium: Math.round(product.per100g.sodium * ratio),
    sugar: Math.round(product.per100g.sugar * ratio * 10) / 10,
    img: product.img,
    grade: product.grade,
    quantity: product.quantity,
  };
}

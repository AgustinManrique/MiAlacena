import { Recipe, RecipeDetail, RecipeIngredient } from '../types';

const BASE = 'https://www.themealdb.com/api/json/v1/1';

/**
 * Mapa ES→EN de ingredientes comunes de la app hacia los nombres que usa
 * TheMealDB (en inglés). Las claves están SIN acentos y en minúsculas, igual
 * que el resultado de `normalize`, para poder matchear directo.
 */
const ES_EN_INGREDIENTS: Record<string, string> = {
  leche: 'milk',
  huevo: 'egg',
  huevos: 'egg',
  harina: 'flour',
  pollo: 'chicken',
  carne: 'beef',
  tomate: 'tomato',
  tomates: 'tomato',
  cebolla: 'onion',
  ajo: 'garlic',
  papa: 'potato',
  papas: 'potato',
  patata: 'potato',
  arroz: 'rice',
  queso: 'cheese',
  manteca: 'butter',
  mantequilla: 'butter',
  azucar: 'sugar',
  sal: 'salt',
  pan: 'bread',
  aceite: 'olive oil',
  atun: 'tuna',
  fideos: 'pasta',
  pasta: 'pasta',
  lentejas: 'lentils',
  zanahoria: 'carrot',
  zanahorias: 'carrot',
  morron: 'pepper',
  pimiento: 'pepper',
  jamon: 'ham',
  salchicha: 'sausage',
  salchichas: 'sausage',
  camaron: 'shrimp',
  camarones: 'shrimp',
  pescado: 'fish',
  cerdo: 'pork',
  limon: 'lemon',
  manzana: 'apple',
  manzanas: 'apple',
  banana: 'banana',
  frutilla: 'strawberry',
  frutillas: 'strawberry',
  espinaca: 'spinach',
  champinon: 'mushroom',
  champinones: 'mushroom',
  hongos: 'mushroom',
  choclo: 'corn',
  maiz: 'corn',
  crema: 'cream',
  yogur: 'yogurt',
  miel: 'honey',
  avena: 'oats',
  garbanzos: 'chickpeas',
  brocoli: 'broccoli',
  calabaza: 'pumpkin',
  apio: 'celery',
  albahaca: 'basil',
  perejil: 'parsley',
  oregano: 'oregano',
};

interface RawFilterMeal {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

const normalize = (str: string): string =>
  str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/**
 * Convierte el nombre de un producto de la alacena a un ingrediente EN.
 * Busca palabra por palabra en el mapa; si nada matchea, usa el nombre
 * completo en minúsculas (sin acentos) como fallback.
 */
export function mapProductToIngredient(productName: string): string {
  const normalized = normalize(productName);
  if (!normalized) return '';
  if (ES_EN_INGREDIENTS[normalized]) return ES_EN_INGREDIENTS[normalized];
  for (const word of normalized.split(/\s+/)) {
    if (ES_EN_INGREDIENTS[word]) return ES_EN_INGREDIENTS[word];
  }
  return normalized;
}

/** GET /filter.php?i=<ing> → meals crudas (o [] ante error / sin resultados). */
export async function filterByIngredient(ing: string): Promise<RawFilterMeal[]> {
  try {
    const res = await fetch(`${BASE}/filter.php?i=${encodeURIComponent(ing)}`);
    const json = await res.json();
    return (json?.meals as RawFilterMeal[] | null) ?? [];
  } catch {
    return [];
  }
}

/** GET /lookup.php?i=<id> → detalle parseado (o null ante error / no encontrada). */
export async function lookupMeal(id: string): Promise<RecipeDetail | null> {
  try {
    const res = await fetch(`${BASE}/lookup.php?i=${encodeURIComponent(id)}`);
    const json = await res.json();
    const meal = json?.meals?.[0];
    if (!meal) return null;

    const ingredients: RecipeIngredient[] = [];
    for (let i = 1; i <= 20; i++) {
      const name = (meal[`strIngredient${i}`] ?? '').trim();
      const measure = (meal[`strMeasure${i}`] ?? '').trim();
      if (name) ingredients.push({ name, measure });
    }

    return {
      id: meal.idMeal,
      name: meal.strMeal,
      thumb: meal.strMealThumb,
      category: meal.strCategory ?? '',
      area: meal.strArea ?? '',
      instructions: meal.strInstructions ?? '',
      ingredients,
    };
  } catch {
    return null;
  }
}

/**
 * Recetas sugeridas para lo que hay en la alacena.
 * Mapea los nombres a ingredientes EN únicos, consulta cada uno, y rankea
 * las recetas por cuántos de tus ingredientes matchean (matchCount).
 * Devuelve el top 20. Ante cualquier error, devuelve [].
 */
export async function getRecipesForPantry(productNames: string[]): Promise<Recipe[]> {
  try {
    const ingredients = Array.from(
      new Set(productNames.map(mapProductToIngredient).filter(Boolean))
    );
    if (ingredients.length === 0) return [];

    const results = await Promise.all(ingredients.map((ing) => filterByIngredient(ing)));

    const byId = new Map<string, Recipe>();
    for (const meals of results) {
      for (const meal of meals) {
        const existing = byId.get(meal.idMeal);
        if (existing) {
          existing.matchCount += 1;
        } else {
          byId.set(meal.idMeal, {
            id: meal.idMeal,
            name: meal.strMeal,
            thumb: meal.strMealThumb,
            matchCount: 1,
          });
        }
      }
    }

    return Array.from(byId.values())
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 20);
  } catch {
    return [];
  }
}

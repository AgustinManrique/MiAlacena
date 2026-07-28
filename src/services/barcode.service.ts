/**
 * Lookup de productos por código de barras contra Open Food Facts.
 * API pública, sin key: un solo GET por scan.
 * Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

export interface BarcodeLookupResult {
  name: string;
  categoryName: string | null;
  imageUrl: string | null;
  barcode: string;
  quantity: string | null; // ej: "1 L" para inferir unidad
}

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_es?: string;
  categories_tags?: string[];
  image_url?: string;
  image_front_url?: string;
  quantity?: string;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

const API_URL = 'https://world.openfoodfacts.org/api/v2/product';

/**
 * categories_tags viene como ["en:dairies", "es:leches", ...].
 * Prioriza la categoría en español; si no hay, usa la primera en inglés.
 */
function resolveCategoryName(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;

  const spanish = tags.find((tag) => tag.startsWith('es:'));
  if (spanish) return spanish.slice(3);

  const english = tags.find((tag) => tag.startsWith('en:'));
  if (english) return english.slice(3);

  return null;
}

export const barcodeService = {
  async lookupBarcode(barcode: string): Promise<BarcodeLookupResult | null> {
    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(barcode)}.json`);
      if (!response.ok) return null;

      const data: OpenFoodFactsResponse = await response.json();
      if (data.status !== 1 || !data.product) return null;

      const { product } = data;
      const name = (product.product_name_es || product.product_name || '').trim();
      if (!name) return null;

      return {
        name,
        categoryName: resolveCategoryName(product.categories_tags),
        imageUrl: product.image_url ?? product.image_front_url ?? null,
        barcode,
        quantity: product.quantity ?? null,
      };
    } catch {
      // Sin conexión o respuesta inválida: el caller ofrece carga manual.
      return null;
    }
  },
};

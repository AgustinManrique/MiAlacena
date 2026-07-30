import { supabase } from '../config/supabase';
import { ConsumptionEvent, ConsumptionStatsMonth } from '../types';

type RelatedCategory =
  | {
      id: string;
      name: string;
      icon: string;
      color: string;
    }
  | Array<{
      id: string;
      name: string;
      icon: string;
      color: string;
    }>
  | null;

type RelatedProduct =
  | {
      id: string;
      name: string;
    }
  | Array<{
      id: string;
      name: string;
    }>
  | null;

type ConsumptionEventRow = {
  quantity_consumed: number;
  reference_month: number;
  reference_year: number;
  category: RelatedCategory;
  product: RelatedProduct;
};

function getSingleRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) return relation[0] || null;
  return relation;
}

function getMonthLabel(referenceMonth: number, referenceYear: number) {
  const date = new Date(referenceYear, referenceMonth - 1, 1);
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getMonthId(referenceMonth: number, referenceYear: number) {
  return `${referenceYear}-${String(referenceMonth).padStart(2, '0')}`;
}

function buildMonthlyStats(rows: ConsumptionEventRow[]): ConsumptionStatsMonth[] {
  const months = new Map<string, ConsumptionStatsMonth>();

  rows.forEach((row) => {
    const monthId = getMonthId(row.reference_month, row.reference_year);
    const month =
      months.get(monthId) ||
      {
        monthId,
        monthLabel: getMonthLabel(row.reference_month, row.reference_year),
        referenceMonth: row.reference_month,
        referenceYear: row.reference_year,
        totalConsumptions: 0,
        categories: [],
      };

    const quantity = Number(row.quantity_consumed) || 0;
    const category = getSingleRelation(row.category);
    const product = getSingleRelation(row.product);
    const categoryName = category?.name || 'Sin categoria';
    const productId = product?.id || 'unknown-product';
    const productName = product?.name || 'Producto eliminado';
    const existingCategory = month.categories.find(
      (item) => item.categoryName === categoryName
    );

    month.totalConsumptions += quantity;

    if (existingCategory) {
      existingCategory.consumptionCount += quantity;
      const existingProduct = existingCategory.products.find(
        (item) => item.productId === productId
      );

      if (existingProduct) {
        existingProduct.consumptionCount += quantity;
      } else {
        existingCategory.products.push({
          productId,
          productName,
          consumptionCount: quantity,
        });
      }
    } else {
      month.categories.push({
        categoryName,
        icon: category?.icon || '📦',
        color: category?.color || '#D7CCC8',
        consumptionCount: quantity,
        percentage: 0,
        products: [
          {
            productId,
            productName,
            consumptionCount: quantity,
          },
        ],
      });
    }

    months.set(monthId, month);
  });

  return Array.from(months.values())
    .map((month) => ({
      ...month,
      categories: month.categories
        .map((category) => ({
          ...category,
          products: category.products.sort(
            (a, b) => b.consumptionCount - a.consumptionCount
          ),
          percentage:
            month.totalConsumptions > 0
              ? Math.round((category.consumptionCount / month.totalConsumptions) * 100)
              : 0,
        }))
        .sort((a, b) => b.consumptionCount - a.consumptionCount),
    }))
    .sort((a, b) => {
      if (a.referenceYear !== b.referenceYear) return a.referenceYear - b.referenceYear;
      return a.referenceMonth - b.referenceMonth;
    });
}

export const consumptionStatsService = {
  async getMonthlyStats(houseId: string): Promise<ConsumptionStatsMonth[]> {
    const { data, error } = await supabase
      .from('consumption_events')
      .select(
        `
          quantity_consumed,
          reference_month,
          reference_year,
          category:categories(id, name, icon, color),
          product:products(id, name)
        `
      )
      .eq('house_id', houseId)
      .order('reference_year', { ascending: true })
      .order('reference_month', { ascending: true });

    if (error) throw error;

    return buildMonthlyStats((data || []) as ConsumptionEventRow[]);
  },

  async createConsumptionEvent(event: ConsumptionEvent): Promise<void> {
    const { error } = await supabase
      .from('consumption_events')
      .upsert(event, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  },
};

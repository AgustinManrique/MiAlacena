import { supabase } from '../config/supabase';
import { ConsumptionEvent, ConsumptionStatsMonth } from '../types';

type ConsumptionEventRow = {
  quantity_consumed: number;
  reference_month: number;
  reference_year: number;
  category:
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
};

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
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    const categoryName = category?.name || 'Sin categoría';
    const existingCategory = month.categories.find(
      (category) => category.categoryName === categoryName
    );

    month.totalConsumptions += quantity;

    if (existingCategory) {
      existingCategory.consumptionCount += quantity;
    } else {
      month.categories.push({
        categoryName,
        icon: category?.icon || '📦',
        color: category?.color || '#D7CCC8',
        consumptionCount: quantity,
        percentage: 0,
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
          category:categories(id, name, icon, color)
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

import monthlyStatsData from '../data/estadisticas_julio.json';
import { DEFAULT_CATEGORIES } from '../config/constants';
import { ConsumptionStatsMonth } from '../types';

type RawConsumptionMonth = {
  monthId: string;
  monthLabel: string;
  categories: Array<{
    categoryName: string;
    amount: number;
  }>;
};

function enrichMonth(month: RawConsumptionMonth): ConsumptionStatsMonth {
  const totalAmount = month.categories.reduce((total, item) => total + item.amount, 0);

  return {
    monthId: month.monthId,
    monthLabel: month.monthLabel,
    totalAmount,
    categories: month.categories.map((item) => {
      const category = DEFAULT_CATEGORIES.find((cat) => cat.name === item.categoryName);

      return {
        categoryName: item.categoryName,
        icon: category?.icon || '📦',
        color: category?.color || '#D7CCC8',
        amount: item.amount,
        percentage: totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0,
      };
    }),
  };
}

export const consumptionStatsService = {
  async getMonthlyStats(): Promise<ConsumptionStatsMonth[]> {
    return monthlyStatsData.months.map(enrichMonth);
  },
};

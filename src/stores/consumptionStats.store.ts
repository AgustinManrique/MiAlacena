import { create } from 'zustand';
import { ConsumptionStatsMonth } from '../types';
import { consumptionStatsService } from '../services/consumptionStats.service';

interface ConsumptionStatsState {
  months: ConsumptionStatsMonth[];
  isLoading: boolean;
  loadMonthlyStats: (houseId: string) => Promise<void>;
  reset: () => void;
}

export const useConsumptionStatsStore = create<ConsumptionStatsState>((set) => ({
  months: [],
  isLoading: false,

  loadMonthlyStats: async (houseId) => {
    set({ isLoading: true });
    try {
      const months = await consumptionStatsService.getMonthlyStats(houseId);
      set({ months, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  reset: () => set({ months: [] }),
}));

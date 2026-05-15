import { create } from 'zustand';
import { ShoppingItem, UnitOfMeasure } from '../types';
import { shoppingService } from '../services/shopping.service';

interface ShoppingState {
  items: ShoppingItem[];
  isLoading: boolean;

  loadItems: (houseId: string) => Promise<void>;
  addItem: (input: {
    house_id: string;
    product_id?: string;
    name: string;
    quantity: number;
    unit: UnitOfMeasure;
    added_by: string;
    source: 'auto' | 'manual';
  }) => Promise<void>;
  togglePurchased: (itemId: string, userId: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearPurchased: (houseId: string) => Promise<void>;
  getPendingCount: () => number;
  reset: () => void;
}

export const useShoppingStore = create<ShoppingState>((set, get) => ({
  items: [],
  isLoading: false,

  loadItems: async (houseId) => {
    set({ isLoading: true });
    try {
      const items = await shoppingService.getItems(houseId);
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (input) => {
    const item = await shoppingService.addItem(input);
    set((state) => ({ items: [item, ...state.items] }));
  },

  togglePurchased: async (itemId, userId) => {
    const updated = await shoppingService.togglePurchased(itemId, userId);
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? updated : i)),
    }));
  },

  removeItem: async (itemId) => {
    await shoppingService.removeItem(itemId);
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
  },

  clearPurchased: async (houseId) => {
    await shoppingService.clearPurchased(houseId);
    set((state) => ({ items: state.items.filter((i) => !i.is_purchased) }));
  },

  getPendingCount: () => get().items.filter((i) => !i.is_purchased).length,

  reset: () => set({ items: [] }),
}));

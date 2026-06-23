import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ShoppingItem, UnitOfMeasure } from '../types';
import { shoppingService } from '../services/shopping.service';
import { asyncStorage } from '../lib/storage';
import { uuidv4 } from '../lib/uuid';
import { enqueueMutation } from '../lib/syncEngine';
import { useSyncStore } from './sync.store';

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

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      loadItems: async (houseId) => {
        set({ isLoading: true });
        try {
          const fetched = await shoppingService.getItems(houseId);
          const pendingIds = useSyncStore
            .getState()
            .queue.filter((m) => m.type === 'shopping.add')
            .map((m) => (m.type === 'shopping.add' ? m.payload.item.id : ''));
          const keepLocal = get().items.filter(
            (i) => pendingIds.includes(i.id) && !fetched.some((f) => f.id === i.id)
          );
          set({ items: [...keepLocal, ...fetched], isLoading: false });
        } catch {
          // Offline: conservamos el cache local.
          set({ isLoading: false });
        }
      },

      addItem: async (input) => {
        const optimistic: ShoppingItem = {
          id: uuidv4(),
          house_id: input.house_id,
          product_id: input.product_id || null,
          name: input.name,
          quantity: input.quantity,
          unit: input.unit,
          is_purchased: false,
          added_by: input.added_by,
          purchased_by: null,
          purchased_at: null,
          source: input.source,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ items: [optimistic, ...state.items] }));
        enqueueMutation({ type: 'shopping.add', payload: { item: optimistic } });
      },

      togglePurchased: async (itemId, userId) => {
        const item = get().items.find((i) => i.id === itemId);
        if (!item) return;
        const isPurchased = !item.is_purchased;

        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  is_purchased: isPurchased,
                  purchased_by: isPurchased ? userId : null,
                  purchased_at: isPurchased ? new Date().toISOString() : null,
                }
              : i
          ),
        }));
        enqueueMutation({
          type: 'shopping.setPurchased',
          payload: { itemId, isPurchased, userId },
        });
      },

      removeItem: async (itemId) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
        enqueueMutation({ type: 'shopping.remove', payload: { itemId } });
      },

      clearPurchased: async (houseId) => {
        set((state) => ({ items: state.items.filter((i) => !i.is_purchased) }));
        enqueueMutation({ type: 'shopping.clearPurchased', payload: { houseId } });
      },

      getPendingCount: () => get().items.filter((i) => !i.is_purchased).length,

      reset: () => set({ items: [] }),
    }),
    {
      name: 'mialacena-shopping',
      storage: asyncStorage,
      partialize: (state) => ({ items: state.items }),
    }
  )
);

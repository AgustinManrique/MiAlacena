import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorage } from '../lib/storage';
import { uuidv4 } from '../lib/uuid';
import { Product, ShoppingItem } from '../types';

/**
 * Estado de sincronización que ve la UI.
 * - synced  : todo subido a Supabase
 * - syncing : drenando la cola contra el servidor
 * - offline : sin conexión, los cambios quedan en cola
 * - error   : una mutación falló y se reintentará
 */
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

/**
 * Una mutación es una operación de ESCRITURA que tiene que llegar a Supabase.
 * Se aplica primero localmente (optimista) y se encola; el motor de sync
 * la reproduce contra el backend cuando hay internet.
 */
export type NewMutation =
  | { type: 'product.create'; payload: { product: Product } }
  | { type: 'product.update'; payload: { productId: string; updates: Partial<Product> } }
  | { type: 'product.delete'; payload: { productId: string } }
  | { type: 'shopping.add'; payload: { item: ShoppingItem } }
  | { type: 'shopping.setPurchased'; payload: { itemId: string; isPurchased: boolean; userId: string } }
  | { type: 'shopping.remove'; payload: { itemId: string } }
  | { type: 'shopping.clearPurchased'; payload: { houseId: string } };

export type PendingMutation = NewMutation & {
  id: string;
  createdAt: number;
  retries: number;
};

interface SyncState {
  isOnline: boolean;
  status: SyncStatus;
  queue: PendingMutation[];

  setOnline: (online: boolean) => void;
  setStatus: (status: SyncStatus) => void;
  enqueue: (m: NewMutation) => void;
  dequeue: (id: string) => void;
  bumpRetry: (id: string) => void;
  pendingCount: () => number;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      status: 'synced',
      queue: [],

      setOnline: (isOnline) => set({ isOnline }),
      setStatus: (status) => set({ status }),

      enqueue: (m) =>
        set((state) => {
          let queue = state.queue;

          // --- Coalescing: si borro algo que todavía no se subió, no tiene
          // sentido mandar create + delete. Saco el create pendiente y listo.
          if (m.type === 'product.delete') {
            const idx = queue.findIndex(
              (q) => q.type === 'product.create' && q.payload.product.id === m.payload.productId
            );
            if (idx !== -1) return { queue: queue.filter((_, i) => i !== idx) };
          }
          if (m.type === 'shopping.remove') {
            const idx = queue.findIndex(
              (q) => q.type === 'shopping.add' && q.payload.item.id === m.payload.itemId
            );
            if (idx !== -1) return { queue: queue.filter((_, i) => i !== idx) };
          }

          const full: PendingMutation = {
            id: uuidv4(),
            createdAt: Date.now(),
            retries: 0,
            ...m,
          };
          return { queue: [...queue, full] };
        }),

      dequeue: (id) =>
        set((state) => ({ queue: state.queue.filter((m) => m.id !== id) })),

      bumpRetry: (id) =>
        set((state) => ({
          queue: state.queue.map((m) =>
            m.id === id ? { ...m, retries: m.retries + 1 } : m
          ),
        })),

      pendingCount: () => get().queue.length,
    }),
    {
      name: 'mialacena-sync',
      storage: asyncStorage,
      // Solo persistimos la cola; isOnline/status son de runtime.
      partialize: (state) => ({ queue: state.queue }),
    }
  )
);

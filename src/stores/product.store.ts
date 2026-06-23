import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Category, UnitOfMeasure, ProductStatus } from '../types';
import { productService } from '../services/product.service';
import { categoryService } from '../services/category.service';
import { asyncStorage } from '../lib/storage';
import { uuidv4 } from '../lib/uuid';
import { enqueueMutation } from '../lib/syncEngine';
import { useSyncStore } from './sync.store';

function computeStatus(quantity: number, minStock: number): ProductStatus {
  if (quantity <= 0) return 'out';
  if (quantity <= minStock) return 'low';
  return 'ok';
}

interface ProductState {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  filter: string | null;

  loadProducts: (houseId: string) => Promise<void>;
  loadCategories: (houseId: string) => Promise<void>;
  createProduct: (input: {
    house_id: string;
    name: string;
    category_id: string | null;
    quantity: number;
    unit: UnitOfMeasure;
    min_stock: number;
    created_by: string;
  }) => Promise<Product>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  updateQuantity: (productId: string, newQuantity: number) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  setFilter: (categoryId: string | null) => void;
  getFilteredProducts: () => Product[];
  reset: () => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      isLoading: false,
      filter: null,

      // --- LECTURA: intenta traer del server; si falla (offline), conserva
      // el cache persistido. Además preserva productos con create pendiente
      // para no pisarlos con la respuesta del server.
      loadProducts: async (houseId) => {
        set({ isLoading: true });
        try {
          const fetched = await productService.getProducts(houseId);
          const pendingIds = useSyncStore
            .getState()
            .queue.filter((m) => m.type === 'product.create')
            .map((m) => (m.type === 'product.create' ? m.payload.product.id : ''));
          const keepLocal = get().products.filter(
            (p) => pendingIds.includes(p.id) && !fetched.some((f) => f.id === p.id)
          );
          set({ products: [...fetched, ...keepLocal], isLoading: false });
        } catch {
          // Sin conexión: mantenemos el cache local.
          set({ isLoading: false });
        }
      },

      loadCategories: async (houseId) => {
        try {
          let categories = await categoryService.getCategories(houseId);
          if (categories.length === 0) {
            categories = await categoryService.createDefaultCategories(houseId);
          }
          set({ categories });
        } catch {
          // Offline: usamos las categorías cacheadas.
        }
      },

      // --- ESCRITURA OPTIMISTA: actualiza local YA y encola para el server.
      createProduct: async (input) => {
        const now = new Date().toISOString();
        const category = get().categories.find((c) => c.id === input.category_id);
        const optimistic: Product = {
          id: uuidv4(),
          house_id: input.house_id,
          category_id: input.category_id,
          name: input.name,
          quantity: input.quantity,
          unit: input.unit,
          min_stock: input.min_stock,
          status: computeStatus(input.quantity, input.min_stock),
          barcode: null,
          expiry_date: null,
          image_url: null,
          created_by: input.created_by,
          updated_at: now,
          created_at: now,
          category,
        };
        set((state) => ({ products: [...state.products, optimistic] }));
        enqueueMutation({ type: 'product.create', payload: { product: optimistic } });
        return optimistic;
      },

      updateProduct: async (productId, updates) => {
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== productId) return p;
            const merged = { ...p, ...updates };
            return {
              ...merged,
              status: computeStatus(merged.quantity, merged.min_stock),
              updated_at: new Date().toISOString(),
            };
          }),
        }));
        enqueueMutation({ type: 'product.update', payload: { productId, updates } });
      },

      updateQuantity: async (productId, newQuantity) => {
        await get().updateProduct(productId, { quantity: Math.max(0, newQuantity) });
      },

      deleteProduct: async (productId) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }));
        enqueueMutation({ type: 'product.delete', payload: { productId } });
      },

      setFilter: (categoryId) => set({ filter: categoryId }),

      getFilteredProducts: () => {
        const { products, filter } = get();
        if (!filter) return products;
        return products.filter((p) => p.category_id === filter);
      },

      reset: () => set({ products: [], categories: [], filter: null }),
    }),
    {
      name: 'mialacena-products',
      storage: asyncStorage,
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
      }),
    }
  )
);

import { create } from 'zustand';
import { Product, Category, UnitOfMeasure } from '../types';
import { productService } from '../services/product.service';
import { categoryService } from '../services/category.service';
import { useShoppingStore } from './shopping.store';
import { useAuthStore } from './auth.store';

function resolveAddedBy(product: Product): string {
  return useAuthStore.getState().session?.user.id ?? product.created_by;
}

async function syncShopping(product: Product) {
  try {
    await useShoppingStore.getState().syncFromProductChange(product, resolveAddedBy(product));
  } catch (err) {
    console.warn('[autoShoppingSync] failed:', err);
  }
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

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  filter: null,

  loadProducts: async (houseId) => {
    set({ isLoading: true });
    try {
      const products = await productService.getProducts(houseId);
      set({ products, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadCategories: async (houseId) => {
    let categories = await categoryService.getCategories(houseId);
    if (categories.length === 0) {
      categories = await categoryService.createDefaultCategories(houseId);
    }
    set({ categories });
  },

  createProduct: async (input) => {
    const product = await productService.createProduct(input);
    set((state) => ({ products: [...state.products, product] }));
    await syncShopping(product);
    return product;
  },

  updateProduct: async (productId, updates) => {
    const updated = await productService.updateProduct(productId, updates);
    set((state) => ({
      products: state.products.map((p) => (p.id === productId ? updated : p)),
    }));
    await syncShopping(updated);
  },

  updateQuantity: async (productId, newQuantity) => {
    const updated = await productService.updateQuantity(productId, newQuantity);
    set((state) => ({
      products: state.products.map((p) => (p.id === productId ? updated : p)),
    }));
    await syncShopping(updated);
  },

  deleteProduct: async (productId) => {
    await productService.deleteProduct(productId);
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
    }));
  },

  setFilter: (categoryId) => set({ filter: categoryId }),

  getFilteredProducts: () => {
    const { products, filter } = get();
    if (!filter) return products;
    return products.filter((p) => p.category_id === filter);
  },

  reset: () => set({ products: [], categories: [], filter: null }),
}));

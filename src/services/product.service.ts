import { supabase } from '../config/supabase';
import { Product, ProductStatus, UnitOfMeasure } from '../types';

function computeStatus(quantity: number, minStock: number): ProductStatus {
  if (quantity <= 0) return 'out';
  if (quantity <= minStock) return 'low';
  return 'ok';
}

export const productService = {
  async getProducts(houseId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('house_id', houseId)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getProduct(productId: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('id', productId)
      .single();
    if (error) throw error;
    return data;
  },

  async createProduct(input: {
    house_id: string;
    name: string;
    category_id: string | null;
    quantity: number;
    unit: UnitOfMeasure;
    min_stock: number;
    created_by: string;
  }): Promise<Product> {
    const status = computeStatus(input.quantity, input.min_stock);
    const { data, error } = await supabase
      .from('products')
      .insert({ ...input, status })
      .select('*, category:categories(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async updateProduct(
    productId: string,
    updates: Partial<Pick<Product, 'name' | 'category_id' | 'quantity' | 'unit' | 'min_stock' | 'barcode' | 'expiry_date' | 'image_url'>>
  ): Promise<Product> {
    const current = await this.getProduct(productId);
    const quantity = updates.quantity ?? current.quantity;
    const minStock = updates.min_stock ?? current.min_stock;
    const status = computeStatus(quantity, minStock);

    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, status, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select('*, category:categories(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async updateQuantity(productId: string, newQuantity: number): Promise<Product> {
    return this.updateProduct(productId, { quantity: Math.max(0, newQuantity) });
  },

  async deleteProduct(productId: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) throw error;
  },
};

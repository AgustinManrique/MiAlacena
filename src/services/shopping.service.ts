import { supabase } from '../config/supabase';
import { ShoppingItem, UnitOfMeasure } from '../types';

export const shoppingService = {
  async getItems(houseId: string): Promise<ShoppingItem[]> {
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*, product:products(*)')
      .eq('house_id', houseId)
      .order('is_purchased')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addItem(input: {
    house_id: string;
    product_id?: string;
    name: string;
    quantity: number;
    unit: UnitOfMeasure;
    added_by: string;
    source: 'auto' | 'manual';
  }): Promise<ShoppingItem> {
    const { data, error } = await supabase
      .from('shopping_items')
      .insert({
        house_id: input.house_id,
        product_id: input.product_id || null,
        name: input.name,
        quantity: input.quantity,
        unit: input.unit,
        added_by: input.added_by,
        source: input.source,
        is_purchased: false,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Inserta un item con id asignado en el cliente (para items creados OFFLINE).
   */
  async addItemWithId(item: ShoppingItem): Promise<ShoppingItem> {
    // Sacamos la relación `product` y el created_at (default en DB).
    const { product, created_at, ...row } = item;
    void product;
    void created_at;
    const { data, error } = await supabase
      .from('shopping_items')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async togglePurchased(itemId: string, userId: string): Promise<ShoppingItem> {
    const { data: current } = await supabase
      .from('shopping_items')
      .select('is_purchased')
      .eq('id', itemId)
      .single();

    const isPurchased = !current?.is_purchased;
    return this.setPurchased(itemId, isPurchased, userId);
  },

  /**
   * Setea el estado de comprado de forma directa (sin leer antes).
   * La UI ya conoce el estado destino, así que el replay no necesita
   * leer de Supabase: evita el problema de "read-before-write" offline.
   */
  async setPurchased(itemId: string, isPurchased: boolean, userId: string): Promise<ShoppingItem> {
    const { data, error } = await supabase
      .from('shopping_items')
      .update({
        is_purchased: isPurchased,
        purchased_by: isPurchased ? userId : null,
        purchased_at: isPurchased ? new Date().toISOString() : null,
      })
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeItem(itemId: string) {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  },

  async clearPurchased(houseId: string) {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('house_id', houseId)
      .eq('is_purchased', true);
    if (error) throw error;
  },
};

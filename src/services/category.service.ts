import { supabase } from '../config/supabase';
import { Category } from '../types';
import { DEFAULT_CATEGORIES } from '../config/constants';

export const categoryService = {
  async getCategories(houseId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('house_id', houseId)
      .order('order');
    if (error) throw error;
    return data || [];
  },

  async createDefaultCategories(houseId: string): Promise<Category[]> {
    const categories = DEFAULT_CATEGORIES.map((cat, index) => ({
      house_id: houseId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      order: index,
    }));

    const { data, error } = await supabase
      .from('categories')
      .insert(categories)
      .select();
    if (error) throw error;
    return data || [];
  },

  async createCategory(houseId: string, name: string, icon: string, color: string): Promise<Category> {
    const { data: existing } = await supabase
      .from('categories')
      .select('order')
      .eq('house_id', houseId)
      .order('order', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order + 1 : 0;

    const { data, error } = await supabase
      .from('categories')
      .insert({ house_id: houseId, name, icon, color, order: nextOrder })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

import { Product, ShoppingItem } from '../types';
import { shoppingService } from './shopping.service';

export type AutoShoppingSyncResult =
  | { type: 'added'; item: ShoppingItem }
  | { type: 'removed'; itemId: string }
  | { type: 'noop' };

export const autoShoppingSync = {
  async syncProduct(product: Product, addedBy: string): Promise<AutoShoppingSyncResult> {
    if (product.status === 'ok') {
      const removedId = await shoppingService.removeAutoPendingByProduct(product.id);
      if (removedId) return { type: 'removed', itemId: removedId };
      return { type: 'noop' };
    }

    const existing = await shoppingService.findAutoPendingByProduct(product.id);
    if (existing) return { type: 'noop' };

    const suggested = product.min_stock > 0 ? product.min_stock : 1;
    const item = await shoppingService.addItem({
      house_id: product.house_id,
      product_id: product.id,
      name: product.name,
      quantity: suggested,
      unit: product.unit,
      added_by: addedBy,
      source: 'auto',
    });
    return { type: 'added', item };
  },
};

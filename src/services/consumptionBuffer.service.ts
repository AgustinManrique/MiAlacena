import { Product, ConsumptionEvent } from '../types';
import { uuidv4 } from '../lib/uuid';
import { enqueueMutation, processQueue } from '../lib/syncEngine';
import { useConsumptionStatsStore } from '../stores/consumptionStats.store';
import { useSyncStore } from '../stores/sync.store';

const CONSUMPTION_CONFIRMATION_BUFFER_MS = 5000;

type PendingConsumption = {
  product: Product;
  quantity: number;
  timer: ReturnType<typeof setTimeout>;
  consumedAt: string;
};

const pendingByProduct = new Map<string, PendingConsumption>();

function getReferenceParts(isoDate: string) {
  const date = new Date(isoDate);
  return {
    reference_month: date.getMonth() + 1,
    reference_year: date.getFullYear(),
  };
}

function buildConsumptionEvent(pending: PendingConsumption): ConsumptionEvent {
  const consumedAt = pending.consumedAt;

  return {
    id: uuidv4(),
    house_id: pending.product.house_id,
    product_id: pending.product.id,
    category_id: pending.product.category_id,
    quantity_consumed: pending.quantity,
    consumed_at: consumedAt,
    ...getReferenceParts(consumedAt),
  };
}

async function confirmConsumption(productId: string) {
  const pending = pendingByProduct.get(productId);
  if (!pending) return;

  pendingByProduct.delete(productId);

  const event = buildConsumptionEvent(pending);
  enqueueMutation({ type: 'consumption.create', payload: { event } });

  if (useSyncStore.getState().isOnline) {
    await processQueue();
    await useConsumptionStatsStore.getState().loadMonthlyStats(event.house_id);
  }
}

function scheduleConsumption(product: Product, quantity: number) {
  const previous = pendingByProduct.get(product.id);
  if (previous) {
    clearTimeout(previous.timer);
  }

  const consumedAt = new Date().toISOString();
  const timer = setTimeout(() => {
    void confirmConsumption(product.id);
  }, CONSUMPTION_CONFIRMATION_BUFFER_MS);

  pendingByProduct.set(product.id, {
    product,
    quantity: (previous?.quantity || 0) + quantity,
    timer,
    consumedAt,
  });
}

function cancelPendingConsumption(productId: string, quantityToCancel: number) {
  const pending = pendingByProduct.get(productId);
  if (!pending) return;

  const remainingQuantity = pending.quantity - quantityToCancel;
  clearTimeout(pending.timer);

  if (remainingQuantity <= 0) {
    pendingByProduct.delete(productId);
    return;
  }

  const timer = setTimeout(() => {
    void confirmConsumption(productId);
  }, CONSUMPTION_CONFIRMATION_BUFFER_MS);

  pendingByProduct.set(productId, {
    ...pending,
    quantity: remainingQuantity,
    timer,
  });
}

export const consumptionBufferService = {
  handleQuantityChange(previousProduct: Product, nextProduct: Product) {
    const previousQuantity = Number(previousProduct.quantity) || 0;
    const nextQuantity = Number(nextProduct.quantity) || 0;

    if (nextQuantity < previousQuantity) {
      scheduleConsumption(previousProduct, previousQuantity - nextQuantity);
      return;
    }

    if (nextQuantity > previousQuantity) {
      cancelPendingConsumption(previousProduct.id, nextQuantity - previousQuantity);
    }
  },
};

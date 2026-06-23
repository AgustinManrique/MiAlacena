import NetInfo from '@react-native-community/netinfo';
import { useSyncStore, PendingMutation, NewMutation } from '../stores/sync.store';
import { productService } from '../services/product.service';
import { shoppingService } from '../services/shopping.service';

const MAX_RETRIES = 5;
let processing = false;
let started = false;

/**
 * Reproduce UNA mutación contra Supabase.
 * El orden FIFO garantiza que un create siempre se ejecuta antes de su
 * update/delete, así nunca pegás a un id que el server todavía no tiene.
 */
async function replay(m: PendingMutation): Promise<void> {
  switch (m.type) {
    case 'product.create':
      await productService.createProductWithId(m.payload.product);
      break;
    case 'product.update':
      await productService.updateProduct(m.payload.productId, m.payload.updates);
      break;
    case 'product.delete':
      await productService.deleteProduct(m.payload.productId);
      break;
    case 'shopping.add':
      await shoppingService.addItemWithId(m.payload.item);
      break;
    case 'shopping.setPurchased':
      await shoppingService.setPurchased(
        m.payload.itemId,
        m.payload.isPurchased,
        m.payload.userId
      );
      break;
    case 'shopping.remove':
      await shoppingService.removeItem(m.payload.itemId);
      break;
    case 'shopping.clearPurchased':
      await shoppingService.clearPurchased(m.payload.houseId);
      break;
  }
}

/**
 * Drena la cola entera, en orden, mientras haya internet.
 * Se puede llamar muchas veces: el flag `processing` evita solapamientos.
 */
export async function processQueue(): Promise<void> {
  const store = useSyncStore.getState();

  if (!store.isOnline) {
    store.setStatus('offline');
    return;
  }
  if (processing) return;
  if (store.queue.length === 0) {
    store.setStatus('synced');
    return;
  }

  processing = true;
  store.setStatus('syncing');

  try {
    while (true) {
      const { queue, isOnline } = useSyncStore.getState();
      if (!isOnline || queue.length === 0) break;

      const m = queue[0];
      try {
        await replay(m);
        useSyncStore.getState().dequeue(m.id);
      } catch (err) {
        // Falló. Asumimos error transitorio (red) y reintentamos luego.
        // Si una mutación se "envenena" (falla MAX_RETRIES), la descartamos
        // para no bloquear toda la cola detrás de ella.
        useSyncStore.getState().bumpRetry(m.id);
        const current = useSyncStore.getState().queue[0];
        if (current && current.id === m.id && current.retries >= MAX_RETRIES) {
          useSyncStore.getState().dequeue(m.id);
          continue;
        }
        break;
      }
    }
  } finally {
    processing = false;
    const { isOnline, queue } = useSyncStore.getState();
    useSyncStore
      .getState()
      .setStatus(!isOnline ? 'offline' : queue.length === 0 ? 'synced' : 'error');
  }
}

/** Encola una mutación y dispara el sync. Lo usan los stores. */
export function enqueueMutation(m: NewMutation): void {
  useSyncStore.getState().enqueue(m);
  void processQueue();
}

/**
 * Arranca el motor: escucha cambios de conectividad y, al volver el internet,
 * drena la cola. Llamalo UNA vez al iniciar la app (ver hooks/useSyncEngine).
 * Devuelve una función para desuscribirse.
 */
export function startSyncEngine(): () => void {
  if (started) return () => {};
  started = true;

  const unsubscribe = NetInfo.addEventListener((state) => {
    const online = !!state.isConnected && state.isInternetReachable !== false;
    const prev = useSyncStore.getState().isOnline;
    useSyncStore.getState().setOnline(online);

    if (online) {
      // Volvió (o sigue) la conexión: intentamos drenar.
      void processQueue();
    } else {
      useSyncStore.getState().setStatus('offline');
    }
    void prev; // (referencia: se podría loguear la transición)
  });

  // Estado inicial al abrir la app.
  NetInfo.fetch().then((state) => {
    const online = !!state.isConnected && state.isInternetReachable !== false;
    useSyncStore.getState().setOnline(online);
    if (online) void processQueue();
    else useSyncStore.getState().setStatus('offline');
  });

  return () => {
    unsubscribe();
    started = false;
  };
}

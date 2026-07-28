import { supabase } from '../config/supabase';
import { Product } from '../types';

interface HousePushPayload {
  house_id: string;
  title: string;
  body: string;
  exclude_user_id?: string;
}

/**
 * Invoca la Edge Function `send-push`, que resuelve los tokens de los
 * miembros de la casa (con el service role) y los envía por la Expo Push API.
 *
 * Best-effort: nunca lanza. Un fallo de push jamás debe romper el flujo
 * principal (crear producto, unirse a casa, etc.).
 */
export async function sendHousePush(payload: HousePushPayload): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-push', {
      body: payload,
    });
    if (error) {
      console.warn('[push] send-push devolvió error:', error.message);
    }
  } catch (err) {
    console.warn('[push] No se pudo invocar send-push:', err);
  }
}

/** Notifica a la casa que un producto quedó con stock bajo o agotado. */
export async function notifyLowStock(product: Product, excludeUserId?: string): Promise<void> {
  const title = product.status === 'out' ? 'Producto agotado' : 'Stock bajo';
  const body =
    product.status === 'out'
      ? `Se agotó ${product.name}`
      : `Queda poco de ${product.name}`;
  await sendHousePush({
    house_id: product.house_id,
    title,
    body,
    exclude_user_id: excludeUserId,
  });
}

/** Notifica a los miembros existentes que alguien se unió a la casa. */
export async function notifyMemberJoined(
  houseId: string,
  memberName: string,
  excludeUserId?: string
): Promise<void> {
  await sendHousePush({
    house_id: houseId,
    title: 'Nuevo miembro',
    body: `${memberName} se unió a la casa`,
    exclude_user_id: excludeUserId,
  });
}

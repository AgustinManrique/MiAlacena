import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/auth.store';
import {
  registerForPushNotificationsAsync,
  unregisterPushToken,
  addNotificationListeners,
} from '../lib/notifications';

/**
 * Orquesta el ciclo de vida de las notificaciones push:
 *  - Al haber sesión (login) → registra el Expo push token en Supabase.
 *  - Al cerrar sesión (logout) → elimina el token de este dispositivo.
 *  - Monta listeners de recepción/tap durante toda la vida de la app.
 *
 * Usalo una vez en App.tsx, junto a useSyncEngine().
 */
export function usePushNotifications(): void {
  const userId = useAuthStore((s) => s.session?.user?.id ?? null);
  const tokenRef = useRef<string | null>(null);

  // Registro / limpieza según el estado de sesión.
  useEffect(() => {
    let cancelled = false;

    if (userId) {
      registerForPushNotificationsAsync(userId)
        .then((token) => {
          if (!cancelled) tokenRef.current = token;
        })
        .catch((err) => console.warn('[push] registro falló:', err));
    } else {
      // Logout: limpiamos el token de este dispositivo (best-effort).
      const previous = tokenRef.current;
      tokenRef.current = null;
      void unregisterPushToken(previous);
    }

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Listeners globales de notificaciones (una sola vez).
  useEffect(() => {
    const cleanup = addNotificationListeners({
      onReceive: (n) => {
        console.log('[push] recibida:', n.request.content.title);
      },
      onRespond: (r) => {
        // La app fue abierta tocando la notificación. Si más adelante se
        // agregan datos de navegación (ej. productId), se puede rutear acá.
        console.log('[push] abierta:', r.notification.request.content.data);
      },
    });
    return cleanup;
  }, []);
}

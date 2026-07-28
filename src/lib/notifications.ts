import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { pushTokenService } from '../services/pushToken.service';

/**
 * Handler global: cómo se muestra una notificación cuando la app está
 * en primer plano. Se configura una sola vez (idealmente al cargar el módulo).
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Crea el canal Android por defecto (requerido para push en Android). */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Notificaciones',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4CAF50',
  });
}

/** Obtiene el projectId de EAS necesario para getExpoPushTokenAsync. */
function getProjectId(): string | undefined {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId
  );
}

/**
 * Pide permisos, obtiene el Expo push token y lo persiste en Supabase.
 * Devuelve el token (o null si no se pudo registrar).
 *
 * Casos manejados:
 *  - No es un dispositivo físico (emulador/web) → null.
 *  - Permisos denegados → null.
 *  - Falta projectId → null (con warning).
 */
export async function registerForPushNotificationsAsync(
  userId: string
): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[push] Las notificaciones push requieren un dispositivo físico.');
    return null;
  }

  await ensureAndroidChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[push] Permiso de notificaciones no concedido.');
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('[push] Falta extra.eas.projectId en app.json; no se puede obtener el token.');
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await pushTokenService.upsertToken(userId, token, Platform.OS);
    return token;
  } catch (err) {
    console.warn('[push] No se pudo obtener/guardar el push token:', err);
    return null;
  }
}

/**
 * Limpia el token de este dispositivo en Supabase (llamar en logout).
 * Es best-effort: si falla, no rompe el logout.
 */
export async function unregisterPushToken(token: string | null): Promise<void> {
  if (!token) return;
  try {
    await pushTokenService.deleteToken(token);
  } catch (err) {
    console.warn('[push] No se pudo eliminar el push token:', err);
  }
}

/** Suscribe listeners de recepción/tap. Devuelve una función de cleanup. */
export function addNotificationListeners(handlers: {
  onReceive?: (notification: Notifications.Notification) => void;
  onRespond?: (response: Notifications.NotificationResponse) => void;
}): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((n) => {
    handlers.onReceive?.(n);
  });
  const responseSub = Notifications.addNotificationResponseReceivedListener((r) => {
    handlers.onRespond?.(r);
  });
  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

/**
 * Generador de UUID v4 sin dependencias nativas.
 * Sirve para asignar un id estable a registros creados OFFLINE,
 * de modo que ese mismo id viaje a Supabase cuando se sincroniza.
 *
 * Nota: usa Math.random (no es criptográficamente fuerte). Para la app
 * de la materia es más que suficiente. Si querés algo más robusto:
 *   import * as Crypto from 'expo-crypto';  // Crypto.randomUUID()
 */
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

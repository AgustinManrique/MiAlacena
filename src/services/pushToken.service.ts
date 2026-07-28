import { supabase } from '../config/supabase';

export const pushTokenService = {
  /**
   * Registra (o actualiza) el Expo push token del usuario actual.
   * La combinación (user_id, token) es única: si ya existe, refresca
   * platform y updated_at en vez de duplicar.
   */
  async upsertToken(userId: string, token: string, platform: string) {
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      );
    if (error) throw error;
  },

  /** Elimina un token puntual (ej. en logout de este dispositivo). */
  async deleteToken(token: string) {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('token', token);
    if (error) throw error;
  },
};

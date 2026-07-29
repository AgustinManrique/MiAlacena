import { supabase } from '../config/supabase';
import { House, HouseMember } from '../types';
import { INVITE_CODE_LENGTH } from '../config/constants';
import { notifyMemberJoined } from '../lib/pushSender';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const houseService = {
  async createHouse(name: string, ownerId: string): Promise<House> {
    const inviteCode = generateInviteCode();

    const { data: house, error } = await supabase
      .from('houses')
      .insert({ name, invite_code: inviteCode, owner_id: ownerId })
      .select()
      .single();
    if (error) throw error;

    const { error: memberError } = await supabase
      .from('house_members')
      .insert({ house_id: house.id, user_id: ownerId, role: 'admin' });
    if (memberError) throw memberError;

    return house;
  },

  async joinHouse(inviteCode: string, userId: string): Promise<House> {
    const { data: house, error } = await supabase
      .from('houses')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();
    if (error) throw new Error('Código de invitación inválido');

    const { data: existing } = await supabase
      .from('house_members')
      .select('id')
      .eq('house_id', house.id)
      .eq('user_id', userId)
      .single();

    if (existing) throw new Error('Ya sos miembro de esta casa');

    const { error: memberError } = await supabase
      .from('house_members')
      .insert({ house_id: house.id, user_id: userId, role: 'member' });
    if (memberError) throw memberError;

    // Avisar a los miembros existentes (best-effort: no rompe el join).
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      await notifyMemberJoined(house.id, profile?.full_name || 'Alguien', userId);
    } catch (err) {
      console.warn('[push] notifyMemberJoined falló:', err);
    }

    return house;
  },

  async getUserHouses(userId: string): Promise<House[]> {
    const { data, error } = await supabase
      .from('house_members')
      .select('house_id, houses(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((m: any) => m.houses);
  },

  async getHouseMembers(houseId: string): Promise<HouseMember[]> {
    const { data, error } = await supabase
      .from('house_members')
      .select(`
        *,
        profile:profiles!house_members_user_id_fkey(*)
      `)
      .eq('house_id', houseId);
    if (error) throw error;
    return data || [];
  },

  async removeMember(houseId: string, userId: string) {
    const { error } = await supabase
      .from('house_members')
      .delete()
      .eq('house_id', houseId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async updateMemberRole(houseId: string, userId: string, role: 'admin' | 'member') {
    const { error } = await supabase
      .from('house_members')
      .update({ role })
      .eq('house_id', houseId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async updateHouseName(houseId: string, name: string): Promise<House> {
    const { data, error } = await supabase
      .from('houses')
      .update({ name })
      .eq('id', houseId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateHouseInviteCode(houseId: string, inviteCode: string): Promise<House> {
    const { data, error } = await supabase
      .from('houses')
      .update({ invite_code: inviteCode.toUpperCase() })
      .eq('id', houseId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateHouse(
    houseId: string,
    updates: { name?: string; invite_code?: string }
  ): Promise<House> {
    const payload: { name?: string; invite_code?: string } = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.invite_code !== undefined) {
      payload.invite_code = updates.invite_code.toUpperCase();
    }

    const { data, error } = await supabase
      .from('houses')
      .update(payload)
      .eq('id', houseId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

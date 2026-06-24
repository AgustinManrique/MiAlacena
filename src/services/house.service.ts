import { supabase } from '../config/supabase';
import { House, HouseMember } from '../types';
import { INVITE_CODE_LENGTH } from '../config/constants';

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
};

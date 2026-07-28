import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { House, HouseMember } from '../types';
import { houseService } from '../services/house.service';
import { asyncStorage } from '../lib/storage';

interface HouseState {
  houses: House[];
  currentHouse: House | null;
  members: HouseMember[];
  isLoading: boolean;
  isUpdatingHouse: boolean;
  updateHouseError: string | null;

  loadHouses: (userId: string) => Promise<void>;
  setCurrentHouse: (house: House) => void;
  createHouse: (name: string, ownerId: string) => Promise<House>;
  joinHouse: (inviteCode: string, userId: string) => Promise<House>;
  loadMembers: (houseId: string) => Promise<void>;
  removeMember: (houseId: string, userId: string) => Promise<void>;
  updateMemberRole: (houseId: string, userId: string, role: 'admin' | 'member') => Promise<void>;
  updateHouseName: (name: string) => Promise<void>;
  updateHouseInviteCode: (inviteCode: string) => Promise<void>;
  updateHouse: (updates: { name?: string; invite_code?: string }) => Promise<void>;
  clearUpdateHouseError: () => void;
  reset: () => void;
}

export const useHouseStore = create<HouseState>()(
  persist(
    (set, get) => ({
      houses: [],
      currentHouse: null,
      members: [],
      isLoading: false,
      isUpdatingHouse: false,
      updateHouseError: null,

      loadHouses: async (userId) => {
        set({ isLoading: true });
        try {
          const houses = await houseService.getUserHouses(userId);
          const currentHouse = get().currentHouse;
          set({
            houses,
            currentHouse: currentHouse || houses[0] || null,
            isLoading: false,
          });
        } catch {
          // Offline: usamos la casa cacheada.
          set({ isLoading: false });
        }
      },

      setCurrentHouse: (house) => set({ currentHouse: house }),

      createHouse: async (name, ownerId) => {
        const house = await houseService.createHouse(name, ownerId);
        set((state) => ({
          houses: [...state.houses, house],
          currentHouse: house,
        }));
        return house;
      },

      joinHouse: async (inviteCode, userId) => {
        const house = await houseService.joinHouse(inviteCode, userId);
        set((state) => ({
          houses: [...state.houses, house],
          currentHouse: house,
        }));
        return house;
      },

      loadMembers: async (houseId) => {
        try {
          const members = await houseService.getHouseMembers(houseId);
          set({ members });
        } catch {
          // Offline.
        }
      },

      removeMember: async (houseId, userId) => {
        await houseService.removeMember(houseId, userId);
        set((state) => ({ members: state.members.filter((m) => m.user_id !== userId) }));
      },

      updateMemberRole: async (houseId, userId, role) => {
        await houseService.updateMemberRole(houseId, userId, role);
        set((state) => ({
          members: state.members.map((m) => (m.user_id === userId ? { ...m, role } : m)),
        }));
      },

      updateHouseName: async (name) => {
        const { currentHouse } = get();
        if (!currentHouse) return;

        set({ isUpdatingHouse: true, updateHouseError: null });

        try {
          const updated = await houseService.updateHouseName(currentHouse.id, name);
          set((state) => ({
            currentHouse: updated,
            houses: state.houses.map((h) => (h.id === updated.id ? updated : h)),
            isUpdatingHouse: false,
          }));
        } catch (err: any) {
          set({
            isUpdatingHouse: false,
            updateHouseError: err.message || 'No se pudo actualizar la casa',
          });
          throw err;
        }
      },

      updateHouseInviteCode: async (inviteCode) => {
        const { currentHouse } = get();
        if (!currentHouse) return;

        set({ isUpdatingHouse: true, updateHouseError: null });

        try {
          const updated = await houseService.updateHouseInviteCode(currentHouse.id, inviteCode);
          set((state) => ({
            currentHouse: updated,
            houses: state.houses.map((h) => (h.id === updated.id ? updated : h)),
            isUpdatingHouse: false,
          }));
        } catch (err: any) {
          set({
            isUpdatingHouse: false,
            updateHouseError: err.message || 'No se pudo actualizar el código de invitación',
          });
          throw err;
        }
      },

      updateHouse: async (updates) => {
        const { currentHouse } = get();
        if (!currentHouse) return;

        set({ isUpdatingHouse: true, updateHouseError: null });

        try {
          const updated = await houseService.updateHouse(currentHouse.id, updates);
          set((state) => ({
            currentHouse: updated,
            houses: state.houses.map((h) => (h.id === updated.id ? updated : h)),
            isUpdatingHouse: false,
          }));
        } catch (err: any) {
          set({
            isUpdatingHouse: false,
            updateHouseError: err.message || 'No se pudo actualizar la casa',
          });
          throw err;
        }
      },

      clearUpdateHouseError: () => set({ updateHouseError: null }),

      reset: () => set({ houses: [], currentHouse: null, members: [] }),
    }),
    {
      name: 'mialacena-house',
      storage: asyncStorage,
      partialize: (state) => ({
        houses: state.houses,
        currentHouse: state.currentHouse,
      }),
    }
  )
);

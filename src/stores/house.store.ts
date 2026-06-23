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

  loadHouses: (userId: string) => Promise<void>;
  setCurrentHouse: (house: House) => void;
  createHouse: (name: string, ownerId: string) => Promise<House>;
  joinHouse: (inviteCode: string, userId: string) => Promise<House>;
  loadMembers: (houseId: string) => Promise<void>;
  reset: () => void;
}

export const useHouseStore = create<HouseState>()(
  persist(
    (set, get) => ({
      houses: [],
      currentHouse: null,
      members: [],
      isLoading: false,

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

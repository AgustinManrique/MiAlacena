import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { authService } from '../services/auth.service';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const session = await authService.getSession();
      set({ session, isAuthenticated: !!session, isLoading: false });
      if (session) {
        await get().loadProfile();
      }
    } catch {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, fullName) => {
    const data = await authService.signUp(email, password, fullName);
    set({ session: data.session, isAuthenticated: !!data.session });
    if (data.session) await get().loadProfile();
  },

  signIn: async (email, password) => {
    const data = await authService.signIn(email, password);
    set({ session: data.session, isAuthenticated: true });
    await get().loadProfile();
  },

  signOut: async () => {
    await authService.signOut();
    set({ session: null, profile: null, isAuthenticated: false });
  },

  loadProfile: async () => {
    const { session } = get();
    if (!session) return;
    const profile = await authService.getProfile(session.user.id);
    set({ profile });
  },

  setSession: (session) => {
    set({ session, isAuthenticated: !!session });
  },
}));

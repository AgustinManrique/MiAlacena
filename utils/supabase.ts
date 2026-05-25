import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const webStorage = {
  getItem: (key: string) =>
    Promise.resolve(typeof window !== 'undefined' ? localStorage.getItem(key) : null),
  setItem: (key: string, value: string) =>
    Promise.resolve(void (typeof window !== 'undefined' && localStorage.setItem(key, value))),
  removeItem: (key: string) =>
    Promise.resolve(void (typeof window !== 'undefined' && localStorage.removeItem(key))),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: Platform.OS === 'web' ? webStorage : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

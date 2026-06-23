import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/**
 * Adaptador de almacenamiento para el middleware `persist` de Zustand.
 * Persiste el estado en AsyncStorage (la persistencia local del stack).
 */
export const asyncStorage = createJSONStorage(() => AsyncStorage);

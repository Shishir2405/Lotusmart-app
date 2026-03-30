import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { IUser } from '../types';
import api from '../services/api';

const secureStorage = {
  getItem: async (name: string) => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface AuthState {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  setUser: (user: IUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isHydrated: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (isHydrated) => set({ isHydrated }),

      fetchMe: async () => {
        try {
          set({ isLoading: true });
          const { data } = await api.get('/auth/me');
          if (data.success) {
            set({ user: data.data, isLoading: false });
          }
        } catch {
          set({ user: null, token: null, isLoading: false });
          await SecureStore.deleteItemAsync('auth_token');
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // ignore
        } finally {
          await SecureStore.deleteItemAsync('auth_token');
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: 'lotusmart-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

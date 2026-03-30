import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IWishlistItem } from '../types';

interface WishlistState {
  items: IWishlistItem[];

  addItem: (item: IWishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: IWishlistItem) => boolean;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  mergeServerWishlist: (serverItems: IWishlistItem[]) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) return state;
          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      toggleItem: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        if (exists) {
          set((state) => ({
            items: state.items.filter((i) => i.productId !== item.productId),
          }));
          return false;
        }
        set((state) => ({ items: [...state.items, item] }));
        return true;
      },

      clearWishlist: () => set({ items: [] }),

      isInWishlist: (productId) => get().items.some((i) => i.productId === productId),

      mergeServerWishlist: (serverItems) =>
        set((state) => {
          const merged = [...state.items];
          for (const item of serverItems) {
            if (!merged.some((i) => i.productId === item.productId)) {
              merged.push(item);
            }
          }
          return { items: merged };
        }),
    }),
    {
      name: 'lotusmart-wishlist',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

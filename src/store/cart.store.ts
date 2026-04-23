import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ICartItem } from '../types';
import { generateCartItemKey } from '../utils/helpers';

export interface AppliedCoupon {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discount: number;
}

interface CartState {
  items: ICartItem[];
  couponCode: string | null;
  discount: number;
  appliedCoupon: AppliedCoupon | null;

  addItem: (item: ICartItem) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  mergeServerCart: (serverItems: ICartItem[]) => void;

  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  isInCart: (productId: string, variant?: string) => boolean;
  getItem: (productId: string, variant?: string) => ICartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discount: 0,
      appliedCoupon: null,

      addItem: (item) =>
        set((state) => {
          const key = generateCartItemKey(item.productId, item.variant);
          const existing = state.items.find(
            (i) => generateCartItemKey(i.productId, i.variant) === key,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                generateCartItemKey(i.productId, i.variant) === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId, variant) =>
        set((state) => ({
          items: state.items.filter(
            (i) =>
              generateCartItemKey(i.productId, i.variant) !==
              generateCartItemKey(productId, variant),
          ),
        })),

      updateQuantity: (productId, quantity, variant) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (i) =>
                  generateCartItemKey(i.productId, i.variant) !==
                  generateCartItemKey(productId, variant),
              ),
            };
          }
          return {
            items: state.items.map((i) =>
              generateCartItemKey(i.productId, i.variant) ===
              generateCartItemKey(productId, variant)
                ? { ...i, quantity }
                : i,
            ),
          };
        }),

      clearCart: () => set({ items: [], couponCode: null, discount: 0, appliedCoupon: null }),

      applyCoupon: (coupon) =>
        set({
          couponCode: coupon.code,
          discount: coupon.discount,
          appliedCoupon: coupon,
        }),

      removeCoupon: () => set({ couponCode: null, discount: 0, appliedCoupon: null }),

      mergeServerCart: (serverItems) =>
        set((state) => {
          const merged = [...state.items];
          for (const serverItem of serverItems) {
            const key = generateCartItemKey(serverItem.productId, serverItem.variant);
            const exists = merged.find((i) => generateCartItemKey(i.productId, i.variant) === key);
            if (!exists) {
              merged.push(serverItem);
            }
          }
          return { items: merged };
        }),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getTotal: () => {
        const state = get();
        const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return Math.max(0, subtotal - state.discount);
      },

      isInCart: (productId, variant) =>
        get().items.some(
          (i) =>
            generateCartItemKey(i.productId, i.variant) === generateCartItemKey(productId, variant),
        ),

      getItem: (productId, variant) =>
        get().items.find(
          (i) =>
            generateCartItemKey(i.productId, i.variant) === generateCartItemKey(productId, variant),
        ),
    }),
    {
      name: 'lotusmart-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discount: state.discount,
        appliedCoupon: state.appliedCoupon,
      }),
    },
  ),
);

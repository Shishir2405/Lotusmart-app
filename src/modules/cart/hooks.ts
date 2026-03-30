import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
} from './api';
import { useAuthStore } from '../../store/auth.store';

export const cartKeys = {
  all: ['cart'] as const,
};

export function useServerCart() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: cartKeys.all,
    queryFn: getCart,
    enabled: !!token,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
      variant,
    }: {
      productId: string;
      quantity: number;
      variant?: string;
    }) => addToCart(productId, quantity, variant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useMergeCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      items: Array<{ productId: string; quantity: number; variant?: string }>,
    ) => mergeCart(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

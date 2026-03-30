import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrders, getOrder, createOrder, cancelOrder, ICreateOrderData } from './api';
import { useCartStore } from '../../store/cart.store';

export const orderKeys = {
  all: ['orders'] as const,
  list: (page?: number) => ['orders', 'list', page] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
};

export function useOrders(page?: number) {
  return useQuery({
    queryKey: orderKeys.list(page),
    queryFn: () => getOrders(page),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const cartStore = useCartStore();

  return useMutation({
    mutationFn: (data: ICreateOrderData) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      cartStore.clearCart();
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

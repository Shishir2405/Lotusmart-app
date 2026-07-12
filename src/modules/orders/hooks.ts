import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrders, getOrder, createOrder, cancelOrder, ICreateOrderData } from './api';

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

  return useMutation({
    mutationFn: (data: ICreateOrderData) => createOrder(data),
    onSuccess: () => {
      // NOTE: do NOT clear the cart here. For Razorpay the order is created
      // BEFORE payment — clearing now would wipe the cart on a cancelled/failed
      // payment. CheckoutScreen clears the cart only after COD placement or a
      // verified Razorpay payment.
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
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

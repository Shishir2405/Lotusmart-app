import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRazorpayOrder, verifyPayment } from './api';
import { orderKeys } from '../orders/hooks';

export function useCreateRazorpayOrder() {
  return useMutation({
    mutationFn: ({ amount, orderId }: { amount: number; orderId: string }) =>
      createRazorpayOrder(amount, orderId),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      paymentId,
      signature,
    }: {
      orderId: string;
      paymentId: string;
      signature: string;
    }) => verifyPayment(orderId, paymentId, signature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

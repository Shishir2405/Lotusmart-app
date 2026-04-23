import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRazorpayOrder, verifyPayment } from './api';
import { orderKeys } from '../orders/hooks';

export function useCreateRazorpayOrder() {
  return useMutation({
    mutationFn: ({ amount, internalOrderId }: { amount: number; internalOrderId: string }) =>
      createRazorpayOrder(amount, internalOrderId),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      internalOrderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    }: {
      internalOrderId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => verifyPayment(internalOrderId, razorpayOrderId, razorpayPaymentId, razorpaySignature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

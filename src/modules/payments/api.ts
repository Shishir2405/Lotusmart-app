import api from '../../services/api';
import { IApiResponse, IOrder } from '../../types';

export const createRazorpayOrder = async (
  amount: number,
  internalOrderId: string,
): Promise<
  IApiResponse<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId?: string;
  }>
> => {
  const response = await api.post('/payments/razorpay', {
    amount,
    internalOrderId,
  });
  return response.data;
};

export const verifyPayment = async (
  internalOrderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): Promise<IApiResponse<{ success: boolean; order: IOrder }>> => {
  const response = await api.post('/payments/verify', {
    internalOrderId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  });
  return response.data;
};

import api from '../../services/api';
import { IApiResponse, IOrder } from '../../types';

export const createRazorpayOrder = async (
  amount: number,
  orderId: string,
): Promise<
  IApiResponse<{ razorpayOrderId: string; amount: number; currency: string }>
> => {
  const response = await api.post('/payments/razorpay/create', {
    amount,
    orderId,
  });
  return response.data;
};

export const verifyPayment = async (
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<IApiResponse<{ success: boolean; order: IOrder }>> => {
  const response = await api.post('/payments/razorpay/verify', {
    orderId,
    paymentId,
    signature,
  });
  return response.data;
};

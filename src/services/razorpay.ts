import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY } from '../config/constants';
import { siteConfig } from '../config/site';

export interface RazorpayOptions {
  orderId: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function openRazorpayCheckout(
  options: RazorpayOptions,
): Promise<RazorpaySuccessResponse> {
  const rzpOptions = {
    key: RAZORPAY_KEY,
    amount: options.amount,
    currency: options.currency || 'INR',
    name: options.name || siteConfig.name,
    description: options.description || 'Order Payment',
    order_id: options.orderId,
    prefill: options.prefill || {},
    theme: { color: '#E8567F' },
  };

  const data = await RazorpayCheckout.open(rzpOptions);
  return data as RazorpaySuccessResponse;
}

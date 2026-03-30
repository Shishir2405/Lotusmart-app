export type PaymentStackParamList = {
  Payment: { orderId: string; amount: number };
};

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

export interface PaymentVerifyData {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

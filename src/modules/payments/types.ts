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

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

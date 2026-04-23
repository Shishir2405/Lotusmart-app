import api from '../../services/api';
import { IApiResponse } from '../../types';

export type CouponDiscountType = 'percentage' | 'fixed';

export interface ICoupon {
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  validUntil?: string;
  usageLimit?: number;
  usedCount?: number;
}

export interface ValidatedCoupon {
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discount: number;
  finalTotal: number;
}

export const listAvailableCoupons = async (): Promise<IApiResponse<ICoupon[]>> => {
  const response = await api.get('/coupons/available');
  return response.data;
};

export const validateCoupon = async (
  code: string,
  orderTotal: number,
): Promise<IApiResponse<ValidatedCoupon>> => {
  const response = await api.post('/coupons/validate', { code, orderTotal });
  return response.data;
};

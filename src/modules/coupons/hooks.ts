import { useMutation, useQuery } from '@tanstack/react-query';
import { listAvailableCoupons, validateCoupon, ValidatedCoupon } from './api';

export const couponKeys = {
  available: ['coupons', 'available'] as const,
};

export function useAvailableCoupons() {
  return useQuery({
    queryKey: couponKeys.available,
    queryFn: listAvailableCoupons,
    staleTime: 2 * 60 * 1000,
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({
      code,
      orderTotal,
    }: {
      code: string;
      orderTotal: number;
    }): Promise<ValidatedCoupon> => validateCoupon(code, orderTotal).then((res) => res.data!),
  });
}

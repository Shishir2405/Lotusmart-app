import { useQuery } from '@tanstack/react-query';
import { getSiteConfig } from './api';

export const siteConfigKeys = {
  config: (key: string) => ['site-config', key] as const,
};

export function useSiteConfig(key: string) {
  return useQuery({
    queryKey: siteConfigKeys.config(key),
    queryFn: () => getSiteConfig(key),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

export function useFAQs() {
  return useSiteConfig('faq');
}

export function useTermsAndConditions() {
  return useSiteConfig('terms');
}

export function usePrivacyPolicy() {
  return useSiteConfig('privacy-policy');
}

export function useRefundPolicy() {
  return useSiteConfig('refund-policy');
}

export function useShippingPolicy() {
  return useSiteConfig('shipping-policy');
}

import { useQuery } from '@tanstack/react-query';
import { getSiteConfig, PolicyValue, ContactValue, FAQItem } from './api';

export const siteConfigKeys = {
  config: (key: string) => ['site-config', key] as const,
};

export function useSiteConfig<T = unknown>(key: string) {
  return useQuery({
    queryKey: siteConfigKeys.config(key),
    queryFn: () => getSiteConfig<T>(key),
    staleTime: 10 * 60 * 1000,
  });
}

export function useFAQs() {
  return useSiteConfig<{ items?: FAQItem[] }>('faq');
}

export function useTermsAndConditions() {
  return useSiteConfig<PolicyValue>('terms');
}

export function usePrivacyPolicy() {
  return useSiteConfig<PolicyValue>('privacy');
}

export function useRefundPolicy() {
  return useSiteConfig<PolicyValue>('refund');
}

export function useShippingPolicy() {
  return useSiteConfig<PolicyValue>('shipping');
}

export function useContactInfo() {
  return useSiteConfig<ContactValue>('contact');
}

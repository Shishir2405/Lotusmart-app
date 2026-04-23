import { useQuery } from '@tanstack/react-query';
import { listBanners, BannerPosition } from './api';

export const bannerKeys = {
  list: (position?: BannerPosition) => ['banners', position ?? 'all'] as const,
};

export function useBanners(position?: BannerPosition) {
  return useQuery({
    queryKey: bannerKeys.list(position),
    queryFn: () => listBanners(position),
    staleTime: 5 * 60 * 1000,
  });
}

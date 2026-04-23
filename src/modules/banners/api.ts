import api from '../../services/api';
import { IApiResponse } from '../../types';

export type BannerPosition = 'hero' | 'sidebar' | 'category';
export type BannerColorScheme = 'amber' | 'olive' | 'rose' | 'emerald' | 'sky';

export interface IBanner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  isActive: boolean;
  sortOrder: number;
  position: BannerPosition;
  colorScheme?: BannerColorScheme;
  createdAt?: string;
  updatedAt?: string;
}

export const listBanners = async (position?: BannerPosition): Promise<IApiResponse<IBanner[]>> => {
  const response = await api.get('/banners', {
    params: position ? { position } : undefined,
  });
  return response.data;
};

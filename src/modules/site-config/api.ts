import api from '../../services/api';
import { IApiResponse } from '../../types';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

export interface PolicyValue {
  title?: string;
  content?: string;
  lastUpdated?: string;
}

export interface ContactValue {
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  mapEmbedUrl?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
  };
  businessHours?: string;
}

export interface SiteConfigEntry<T = unknown> {
  key: string;
  value: T | null;
}

export const getSiteConfig = async <T = unknown>(
  key: string,
): Promise<IApiResponse<SiteConfigEntry<T>>> => {
  const response = await api.get(`/site-config`, { params: { key } });
  return response.data;
};

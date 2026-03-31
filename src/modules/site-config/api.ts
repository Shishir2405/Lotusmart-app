import api from '../../services/api';
import { IApiResponse } from '../../types';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

export interface SiteConfigValue {
  key: string;
  value: any;
}

export const getSiteConfig = async (
  key: string,
): Promise<IApiResponse<SiteConfigValue>> => {
  const response = await api.get(`/site-config/${key}`);
  return response.data;
};

import api from '../../services/api';
import { IApiResponse, IPaginatedResponse } from '../../types';

export interface IBlogSummary {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  tags: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
}

export interface IBlog extends IBlogSummary {
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: 'draft' | 'published' | 'archived';
  isActive?: boolean;
}

export interface BlogListParams {
  page?: number;
  limit?: number;
  tag?: string;
  search?: string;
}

export const listBlogs = async (
  params: BlogListParams = {},
): Promise<IPaginatedResponse<IBlogSummary[]>> => {
  const response = await api.get('/blog', { params });
  return response.data;
};

export const getBlog = async (slug: string): Promise<IApiResponse<IBlog>> => {
  const response = await api.get(`/blog/${encodeURIComponent(slug)}`);
  return response.data;
};

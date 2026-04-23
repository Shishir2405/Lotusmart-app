import api from '../../services/api';
import {
  IApiResponse,
  ICategory,
  IPaginatedResponse,
  IProduct,
  IProductFilters,
} from '../../types';

export const getProducts = async (
  filters: IProductFilters,
): Promise<IPaginatedResponse<IProduct[]>> => {
  const response = await api.get('/products', { params: filters });
  return response.data;
};

export const getProduct = async (id: string): Promise<IApiResponse<IProduct>> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const searchProducts = async (query: string): Promise<IApiResponse<IProduct[]>> => {
  const response = await api.get('/products/search', {
    params: { query },
  });
  return response.data;
};

export const getCategories = async (
  options: { flat?: boolean; includeSubcategories?: boolean } = {},
): Promise<IApiResponse<ICategory[]>> => {
  const params: Record<string, string> = {};
  if (options.flat) params.flat = 'true';
  if (options.includeSubcategories) params.includeSubcategories = 'true';
  const response = await api.get('/categories', { params });
  return response.data;
};

export const getCategoryBySlug = async (
  slug: string,
): Promise<IApiResponse<ICategory & { products: IProduct[] }>> => {
  const response = await api.get(`/categories/${slug}`);
  return response.data;
};

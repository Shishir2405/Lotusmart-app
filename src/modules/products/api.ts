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

export const getProduct = async (
  id: string,
): Promise<IApiResponse<IProduct>> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const searchProducts = async (
  query: string,
): Promise<IApiResponse<IProduct[]>> => {
  const response = await api.get('/products/search', {
    params: { query },
  });
  return response.data;
};

export const getCategories = async (): Promise<IApiResponse<ICategory[]>> => {
  const response = await api.get('/categories');
  return response.data;
};

export const getCategoryBySlug = async (
  slug: string,
): Promise<IApiResponse<ICategory & { products: IProduct[] }>> => {
  const response = await api.get(`/categories/${slug}`);
  return response.data;
};

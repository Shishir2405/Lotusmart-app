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
  // Web /api/products reads `featured`, not `isFeatured`. Map it across.
  const { isFeatured, ...rest } = filters;
  const params: Record<string, unknown> = { ...rest };
  if (isFeatured !== undefined) {
    params.featured = isFeatured;
  }
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProduct = async (id: string): Promise<IApiResponse<IProduct>> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Web /products/search reads `q` (fuzzy partial match) and returns a LEAN shape:
// { id, name, slug, price, image }. Map it to the shape SearchScreen expects.
interface ISearchResultLean {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
}

export const searchProducts = async (
  query: string,
): Promise<IApiResponse<Partial<IProduct>[]>> => {
  const response = await api.get<IApiResponse<ISearchResultLean[]>>('/products/search', {
    params: { q: query },
  });
  const { data, ...rest } = response.data;
  const mapped = (data ?? []).map((r) => ({
    _id: r.id,
    name: r.name,
    slug: r.slug,
    price: r.price,
    images: r.image ? [r.image] : [],
  }));
  return { ...rest, data: mapped };
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

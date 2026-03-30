import { useQuery } from '@tanstack/react-query';
import {
  getProducts,
  getProduct,
  searchProducts,
  getCategories,
} from './api';
import { useDebounce } from '../../hooks/useDebounce';
import { IProductFilters } from '../../types';

export const productKeys = {
  all: ['products'] as const,
  list: (filters: IProductFilters) => ['products', 'list', filters] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
  search: (query: string) => ['products', 'search', query] as const,
  categories: ['categories'] as const,
  featured: ['products', 'featured'] as const,
};

export function useProducts(filters: IProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}

export function useSearchProducts(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: productKeys.search(debouncedQuery),
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: getCategories,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: productKeys.featured,
    queryFn: () => getProducts({ isFeatured: true }),
  });
}

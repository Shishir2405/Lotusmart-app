import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getProducts, getProduct, searchProducts, getCategories } from './api';
import { useDebounce } from '../../hooks/useDebounce';
import { ICategory, IProductFilters } from '../../types';

export const productKeys = {
  all: ['products'] as const,
  list: (filters: IProductFilters) => ['products', 'list', filters] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
  search: (query: string) => ['products', 'search', query] as const,
  categories: ['categories'] as const,
  categoriesFlat: ['categories', 'flat'] as const,
  featured: ['products', 'featured'] as const,
};

export interface CategoryNode extends ICategory {
  children: CategoryNode[];
}

export function useProducts(filters: IProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useSearchProducts(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: productKeys.search(debouncedQuery),
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: () => getCategories(),
    staleTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetches the flat list of every active category and reconstructs the tree.
 * The `parent` id on each category points at its parent node (or null for roots).
 * Returned nodes carry a `children` array sorted by sortOrder then name.
 */
export function useCategoryTree() {
  const query = useQuery({
    queryKey: productKeys.categoriesFlat,
    queryFn: () => getCategories({ flat: true }),
    staleTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const tree = useMemo<CategoryNode[]>(() => {
    const flat = query.data?.data ?? [];
    if (flat.length === 0) return [];
    const byId = new Map<string, CategoryNode>();
    flat.forEach((c) => byId.set(c._id, { ...c, children: [] }));
    const roots: CategoryNode[] = [];
    byId.forEach((node) => {
      const parentId = node.parent;
      if (parentId && byId.has(parentId)) {
        byId.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    const sortNodes = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      nodes.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);
    return roots;
  }, [query.data]);

  return { ...query, tree };
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: productKeys.featured,
    queryFn: () => getProducts({ isFeatured: true }),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

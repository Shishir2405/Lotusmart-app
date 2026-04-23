import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listBlogs, getBlog, BlogListParams } from './api';

export const blogKeys = {
  list: (params: BlogListParams) => ['blogs', 'list', params] as const,
  detail: (slug: string) => ['blogs', 'detail', slug] as const,
};

export function useBlogs(params: BlogListParams = {}) {
  return useQuery({
    queryKey: blogKeys.list(params),
    queryFn: () => listBlogs(params),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useBlog(slug: string | undefined) {
  return useQuery({
    queryKey: blogKeys.detail(slug ?? ''),
    queryFn: () => getBlog(slug as string),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

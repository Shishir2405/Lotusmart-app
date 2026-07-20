import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { listReels, likeReel, DEFAULT_REELS_LIMIT } from './api';

export const reelKeys = {
  all: ['reels'] as const,
  list: (limit: number) => ['reels', 'list', limit] as const,
  infinite: (limit: number) => ['reels', 'infinite', limit] as const,
};

/**
 * First page only — powers the "Watch & Buy" carousel on the Home screen.
 */
export function useReels(limit: number = DEFAULT_REELS_LIMIT) {
  return useQuery({
    queryKey: reelKeys.list(limit),
    queryFn: () => listReels({ page: 1, limit }),
    staleTime: 5 * 60 * 1000,
  });
}

// Paginated feed: pages ACCUMULATE (flatMap) instead of replacing each other,
// so scrolling the full-screen reel feed loads more instead of swapping the
// visible page. Same cursor shape as `useInfiniteProducts`.
export function useInfiniteReels(limit: number = DEFAULT_REELS_LIMIT) {
  return useInfiniteQuery({
    queryKey: reelKeys.infinite(limit),
    queryFn: ({ pageParam }) => listReels({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = lastPage.pagination;
      return p && p.page < p.totalPages ? p.page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Toggle a reel's like. The reel feed manages its own optimistic UI + local
 * per-device liked state (AsyncStorage), so this is a thin wrapper that just
 * fires the request and returns the reconciled count — no cache writes here.
 */
export function useLikeReel() {
  return useMutation({
    mutationFn: ({ reelId, liked }: { reelId: string; liked: boolean }) => likeReel(reelId, liked),
  });
}

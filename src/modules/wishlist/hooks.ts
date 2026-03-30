import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWishlist, addToWishlist, removeFromWishlist, mergeWishlist } from './api';
import { useAuthStore } from '../../store/auth.store';

export const wishlistKeys = {
  all: ['wishlist'] as const,
};

export function useServerWishlist() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: wishlistKeys.all,
    queryFn: getWishlist,
    enabled: !!token,
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      isInWishlist,
    }: {
      productId: string;
      isInWishlist: boolean;
    }) => {
      if (isInWishlist) {
        return removeFromWishlist(productId);
      }
      return addToWishlist(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}

export function useMergeWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: Array<{ productId: string }>) => mergeWishlist(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}

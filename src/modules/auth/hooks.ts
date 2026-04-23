import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import {
  login,
  register,
  googleAuth,
  completeProfile,
  verifyEmail,
  getMe,
  updateProfile,
  forgotPassword,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  RegisterPayload,
  CompleteProfilePayload,
  UpdateProfilePayload,
} from './api';
import { mergeCart } from '../cart/api';
import { mergeWishlist } from '../wishlist/api';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import { useWishlistStore } from '../../store/wishlist.store';
import { IAddress } from '../../types';

export const authKeys = {
  me: ['auth', 'me'] as const,
  addresses: ['auth', 'addresses'] as const,
};

export function useLogin() {
  const { setUser, setToken } = useAuthStore();
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: async (response) => {
      const { token, user } = response.data!;
      await SecureStore.setItemAsync('auth_token', token);
      setToken(token);
      setUser(user);

      // Merge local cart and wishlist with server
      try {
        if (cartStore.items.length > 0) {
          const cartItems = cartStore.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variant: item.variant,
          }));
          const cartResponse = await mergeCart(cartItems);
          if (cartResponse.data) {
            cartStore.mergeServerCart(cartResponse.data);
          }
        }

        if (wishlistStore.items.length > 0) {
          const wishlistItems = wishlistStore.items.map((item) => ({
            productId: item.productId,
          }));
          const wishlistResponse = await mergeWishlist(wishlistItems);
          if (wishlistResponse.data) {
            wishlistStore.mergeServerWishlist(wishlistResponse.data);
          }
        }
      } catch {
        // Merge failures should not block login
      }
    },
  });
}

export function useRegister() {
  const { setUser, setToken } = useAuthStore();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: async (response) => {
      const { token, user } = response.data!;
      if (token) {
        await SecureStore.setItemAsync('auth_token', token);
        setToken(token);
      }
      setUser(user);
    },
  });
}

export function useGoogleAuth() {
  const { setUser, setToken } = useAuthStore();

  return useMutation({
    mutationFn: (idToken: string) => googleAuth(idToken),
    onSuccess: async (response) => {
      const { token, user } = response.data!;
      if (token) {
        await SecureStore.setItemAsync('auth_token', token);
        setToken(token);
      }
      setUser(user);
    },
  });
}

export function useCompleteProfile() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompleteProfilePayload) => completeProfile(payload),
    onSuccess: (response) => {
      const { user } = response.data!;
      setUser(user);
      queryClient.invalidateQueries({ queryKey: authKeys.me });
      queryClient.invalidateQueries({ queryKey: authKeys.addresses });
    },
  });
}

export function useVerifyEmail() {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (token: string) => verifyEmail(token),
    onSuccess: (response) => {
      const { user } = response.data!;
      setUser(user);
    },
  });
}

export function useLogout() {
  const authStore = useAuthStore();
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authStore.logout();
    },
    onSuccess: () => {
      cartStore.clearCart();
      wishlistStore.clearWishlist();
      queryClient.clear();
    },
  });
}

export function useMe() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: authKeys.me,
    queryFn: getMe,
    enabled: !!token,
  });
}

export function useUpdateProfile() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (response) => {
      const updated = response.data;
      if (updated) setUser(updated);
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => forgotPassword(email),
  });
}

export function useAddresses() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: authKeys.addresses,
    queryFn: getAddresses,
    enabled: !!token,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<IAddress, '_id'>) => createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.addresses });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IAddress> }) => updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.addresses });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.addresses });
    },
  });
}

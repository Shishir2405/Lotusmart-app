import { useAuthStore } from '../store/auth.store';
import { useLogin, useRegister, useLogout } from '../modules/auth/hooks';

export function useAuth() {
  const { user, token, isLoading, isHydrated } = useAuthStore();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  return {
    user,
    token,
    isLoading,
    isHydrated,
    isAuthenticated: !!token && !!user,

    login: loginMutation.mutateAsync,
    loginStatus: {
      isPending: loginMutation.isPending,
      isError: loginMutation.isError,
      error: loginMutation.error,
    },

    register: registerMutation.mutateAsync,
    registerStatus: {
      isPending: registerMutation.isPending,
      isError: registerMutation.isError,
      error: registerMutation.error,
    },

    logout: logoutMutation.mutateAsync,
    logoutStatus: {
      isPending: logoutMutation.isPending,
    },
  };
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, changePassword } from './api';
import { authKeys } from '../auth/hooks';
import { IUser } from '../../types';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Pick<IUser, 'name' | 'phone' | 'avatar'>>) =>
      updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      oldPassword,
      newPassword,
    }: {
      oldPassword: string;
      newPassword: string;
    }) => changePassword(oldPassword, newPassword),
  });
}

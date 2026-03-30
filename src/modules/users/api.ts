import api from '../../services/api';
import { IApiResponse, IUser } from '../../types';

export const updateProfile = async (
  data: Partial<Pick<IUser, 'name' | 'phone' | 'avatar'>>,
): Promise<IApiResponse<IUser>> => {
  const response = await api.put('/users/profile', data);
  return response.data;
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string,
): Promise<IApiResponse<{ message: string }>> => {
  const response = await api.put('/users/change-password', {
    oldPassword,
    newPassword,
  });
  return response.data;
};

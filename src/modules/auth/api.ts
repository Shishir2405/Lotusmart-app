import api from '../../services/api';
import { IAddress, IApiResponse, IUser } from '../../types';

export interface RegisterAddressPayload {
  fullName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  label?: 'home' | 'work' | 'other';
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address?: RegisterAddressPayload;
}

export interface CompleteProfilePayload {
  phone: string;
  address: RegisterAddressPayload;
}

export const login = async (
  email: string,
  password: string,
): Promise<IApiResponse<{ token: string; user: IUser }>> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (
  payload: RegisterPayload,
): Promise<IApiResponse<{ token?: string; user: IUser }>> => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

export const googleAuth = async (
  idToken: string,
): Promise<
  IApiResponse<{
    token: string;
    user: IUser;
    isNew: boolean;
    profileComplete: boolean;
  }>
> => {
  const response = await api.post('/auth/google', { idToken });
  return response.data;
};

export const completeProfile = async (
  payload: CompleteProfilePayload,
): Promise<IApiResponse<{ user: IUser }>> => {
  const response = await api.post('/auth/complete-profile', payload);
  return response.data;
};

export const verifyEmail = async (token: string): Promise<IApiResponse<{ user: IUser }>> => {
  const response = await api.post('/auth/verify-email', { token });
  return response.data;
};

export const getMe = async (): Promise<IApiResponse<IUser>> => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const forgotPassword = async (email: string): Promise<IApiResponse<{ message: string }>> => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (
  token: string,
  password: string,
): Promise<IApiResponse<{ message: string }>> => {
  const response = await api.post('/auth/reset-password', {
    token,
    password,
  });
  return response.data;
};

export const getAddresses = async (): Promise<IApiResponse<IAddress[]>> => {
  const response = await api.get('/auth/addresses');
  return response.data;
};

export const createAddress = async (
  data: Omit<IAddress, '_id'>,
): Promise<IApiResponse<IAddress>> => {
  const response = await api.post('/auth/addresses', data);
  return response.data;
};

export const updateAddress = async (
  id: string,
  data: Partial<IAddress>,
): Promise<IApiResponse<IAddress>> => {
  const response = await api.put(`/auth/addresses/${id}`, data);
  return response.data;
};

export const deleteAddress = async (id: string): Promise<IApiResponse<void>> => {
  const response = await api.delete(`/auth/addresses/${id}`);
  return response.data;
};

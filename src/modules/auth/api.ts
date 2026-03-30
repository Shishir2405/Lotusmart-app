import api from '../../services/api';
import { IAddress, IApiResponse, IUser } from '../../types';

export const login = async (
  email: string,
  password: string,
): Promise<IApiResponse<{ token: string; user: IUser }>> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (
  name: string,
  email: string,
  password: string,
): Promise<IApiResponse<{ token: string; user: IUser }>> => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const getMe = async (): Promise<IApiResponse<IUser>> => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const forgotPassword = async (
  email: string,
): Promise<IApiResponse<{ message: string }>> => {
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

export const deleteAddress = async (
  id: string,
): Promise<IApiResponse<void>> => {
  const response = await api.delete(`/auth/addresses/${id}`);
  return response.data;
};

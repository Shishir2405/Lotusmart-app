import api from '../../services/api';
import { IApiResponse, ICartItem } from '../../types';

export const getCart = async (): Promise<IApiResponse<ICartItem[]>> => {
  const response = await api.get('/cart');
  return response.data;
};

export const addToCart = async (
  productId: string,
  quantity: number,
  variant?: string,
): Promise<IApiResponse<ICartItem[]>> => {
  const response = await api.post('/cart', { productId, quantity, variant });
  return response.data;
};

export const updateCartItem = async (
  itemId: string,
  quantity: number,
): Promise<IApiResponse<ICartItem[]>> => {
  const response = await api.put(`/cart/${itemId}`, { quantity });
  return response.data;
};

export const removeCartItem = async (
  itemId: string,
): Promise<IApiResponse<ICartItem[]>> => {
  const response = await api.delete(`/cart/${itemId}`);
  return response.data;
};

export const clearCart = async (): Promise<IApiResponse<void>> => {
  const response = await api.delete('/cart');
  return response.data;
};

export const mergeCart = async (
  items: Array<{ productId: string; quantity: number; variant?: string }>,
): Promise<IApiResponse<ICartItem[]>> => {
  const response = await api.post('/cart/merge', { items });
  return response.data;
};

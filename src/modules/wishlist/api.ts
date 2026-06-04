import api from '../../services/api';
import { IApiResponse, IWishlistItem } from '../../types';

export const getWishlist = async (): Promise<
  IApiResponse<IWishlistItem[]>
> => {
  const response = await api.get('/wishlist');
  return response.data;
};

export const addToWishlist = async (
  productId: string,
): Promise<IApiResponse<IWishlistItem[]>> => {
  const response = await api.post('/wishlist', { productId });
  return response.data;
};

export const removeFromWishlist = async (
  productId: string,
): Promise<IApiResponse<IWishlistItem[]>> => {
  // Web route expects productId as a query param, not a path param.
  const response = await api.delete('/wishlist', { params: { productId } });
  return response.data;
};

export const mergeWishlist = async (
  items: Array<{ productId: string }>,
): Promise<IApiResponse<IWishlistItem[]>> => {
  const response = await api.post('/wishlist/merge', { items });
  return response.data;
};

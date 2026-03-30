import api from '../../services/api';
import {
  IAddress,
  IApiResponse,
  IOrder,
  IOrderItem,
  IPaginatedResponse,
  PaymentMethod,
} from '../../types';

export interface ICreateOrderData {
  items: Omit<IOrderItem, 'name' | 'image'>[];
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

export const createOrder = async (
  data: ICreateOrderData,
): Promise<IApiResponse<IOrder>> => {
  const response = await api.post('/orders', data);
  return response.data;
};

export const getOrders = async (
  page?: number,
  limit?: number,
): Promise<IPaginatedResponse<IOrder[]>> => {
  const response = await api.get('/orders', { params: { page, limit } });
  return response.data;
};

export const getOrder = async (
  id: string,
): Promise<IApiResponse<IOrder>> => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const cancelOrder = async (
  id: string,
): Promise<IApiResponse<IOrder>> => {
  const response = await api.put(`/orders/${id}/cancel`);
  return response.data;
};

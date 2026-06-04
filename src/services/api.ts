import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/constants';
import { getDeviceId } from '../utils/deviceId';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'LotusApp',
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Stable guest id so logged-out wishlist/cart toggles persist server-side.
  try {
    const deviceId = await getDeviceId();
    if (deviceId) {
      config.headers['x-device-id'] = deviceId;
    }
  } catch {
    // Non-fatal: proceed without the device id.
  }
  if (__DEV__) {
    const method = (config.method ?? 'get').toUpperCase();
    console.log(`[api ->] ${method} ${config.url}`);
  }
  return config;
});

function summarize(body: unknown, max = 400) {
  if (body == null) return '';
  try {
    const s = typeof body === 'string' ? body : JSON.stringify(body);
    return s.length > max ? `${s.slice(0, max)}... [truncated]` : s;
  } catch {
    return '[unserializable]';
  }
}

api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      const method = (response.config.method ?? 'get').toUpperCase();
      console.log(`[api <-] ${response.status} ${method} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const cfg = error.config;
    const method = (cfg?.method ?? 'get').toUpperCase();
    const url = cfg?.url ?? '(no url)';
    const status = error.response?.status ?? 'NO_RESPONSE';
    const code = error.code ?? 'UNKNOWN';
    const responseBody = summarize(error.response?.data);
    const requestBody = summarize(cfg?.data);

    // Prominent log so it's easy to spot in Metro / Expo terminal.
    console.warn(
      `[api ERROR] ${status} ${method} ${url}\n` +
        `  code: ${code}\n` +
        `  message: ${error.message}\n` +
        (requestBody ? `  request: ${requestBody}\n` : '') +
        (responseBody ? `  response: ${responseBody}` : ''),
    );

    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  },
);

export default api;

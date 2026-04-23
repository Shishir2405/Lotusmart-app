import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/constants';

export type UploadTarget = 'products' | 'banners' | 'categories' | 'profiles' | 'blog';

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Uploads a local image (file:// URI from expo-image-picker) to the website's
 * /api/upload endpoint as multipart/form-data. Returns the hosted URL + key.
 *
 * Uses fetch directly because RN's fetch handles multipart with a ReactNative-
 * style file descriptor ({ uri, name, type }), which Axios does not support
 * identically across all platforms.
 */
export async function uploadImage(fileUri: string, target: UploadTarget): Promise<UploadResult> {
  const token = await SecureStore.getItemAsync('auth_token');
  const extMatch = /\.(\w+)(?:\?|$)/.exec(fileUri);
  const ext = (extMatch?.[1] ?? 'jpg').toLowerCase();
  const mime =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'gif'
          ? 'image/gif'
          : 'image/jpeg';

  const form = new FormData();
  form.append('target', target);
  // React Native expects this object shape for file parts.
  form.append('file', {
    uri: fileUri,
    name: `upload.${ext === 'jpeg' ? 'jpg' : ext}`,
    type: mime,
  } as unknown as Blob);

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const payload = (await res.json().catch(() => null)) as {
    success: boolean;
    message?: string;
    data?: UploadResult;
  } | null;

  if (!res.ok || !payload?.success || !payload.data?.url) {
    throw new Error(payload?.message || `Upload failed (${res.status})`);
  }
  return payload.data;
}

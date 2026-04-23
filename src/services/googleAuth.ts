import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from '../config/constants';

WebBrowser.maybeCompleteAuthSession();

export interface UseGoogleIdTokenResult {
  request: ReturnType<typeof Google.useIdTokenAuthRequest>[0];
  promptAsync: ReturnType<typeof Google.useIdTokenAuthRequest>[2];
  isConfigured: boolean;
}

export function useGoogleIdToken(
  onIdToken: (idToken: string) => void,
  onError?: (message: string) => void,
): UseGoogleIdTokenResult {
  const isConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params.id_token ?? response.authentication?.idToken;
      if (idToken) {
        onIdToken(idToken);
      } else {
        onError?.('Google did not return an ID token. Please try again.');
      }
    } else if (response.type === 'error') {
      onError?.(response.error?.message ?? 'Google sign-in failed. Please try again.');
    }
    // onIdToken/onError are intentionally excluded to avoid repeat firings
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return { request, promptAsync, isConfigured };
}

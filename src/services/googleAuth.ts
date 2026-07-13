import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../config/constants';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  // webClientId is the OAuth WEB client — the returned ID token is minted with
  // this client as its audience, which is exactly what the backend verifies.
  // The native sign-in itself is authorized by the ANDROID OAuth client, matched
  // automatically by package name + the app's SHA-1 (no browser, no redirect).
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

/**
 * Native, in-app Google sign-in. Shows the system account picker (no Chrome, no
 * custom-URI-scheme redirect) and returns a Google ID token to send to the
 * backend. Throws Error('CANCELLED') if the user dismisses the picker.
 */
export async function signInWithGoogle(): Promise<string> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (response.type !== 'success') {
    throw new Error('CANCELLED');
  }
  const idToken = response.data?.idToken;
  if (!idToken) {
    throw new Error('Google did not return an ID token. Please try again.');
  }
  return idToken;
}

export async function signOutFromGoogle(): Promise<void> {
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
  } catch {
    // best-effort; ignore
  }
}

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'device_id';

// In-memory cache so we only hit SecureStore once per session.
let cachedDeviceId: string | null = null;
let inFlight: Promise<string> | null = null;

/**
 * Returns a stable, persisted device id used to keep guest (logged-out)
 * wishlist/cart state on the server via the `x-device-id` header.
 * Generates and persists a UUID on first call.
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (!id) {
        id = Crypto.randomUUID();
        await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
      }
      cachedDeviceId = id;
      return id;
    } catch {
      // SecureStore can fail (e.g. on web / restricted env); fall back to an
      // ephemeral in-memory id so guest requests still carry a device id.
      const fallback = Crypto.randomUUID();
      cachedDeviceId = fallback;
      return fallback;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

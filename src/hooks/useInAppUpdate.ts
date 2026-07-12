import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as InAppUpdates from 'expo-in-app-updates';

/**
 * On app launch, checks the Play Store (Android) / App Store (iOS) for a newer
 * version and — if one is available — starts a non-blocking FLEXIBLE in-app
 * update so the user can update right inside the app (Android downloads in the
 * background; iOS is sent to the store).
 *
 * Safe no-op when the app isn't installed from a store (dev client, sideloaded
 * APK), when offline, or on web — all failures are swallowed.
 */
export function useInAppUpdate() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        // false = flexible update (background download, user keeps browsing).
        await InAppUpdates.checkAndStartUpdate(false);
      } catch {
        // Off-store / offline / no update available — ignore silently.
      }
    })();
  }, []);
}

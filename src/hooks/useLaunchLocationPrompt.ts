import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '../store/location.store';
import { reverseGeocode } from '../services/location';

/**
 * Requests location once per app launch so delivery-address forms
 * (Checkout, Addresses, Complete Profile) can autofill instantly instead of
 * each independently prompting and running GPS the first time they open.
 *
 * - If permission is already granted, silently prefetches the address in the
 *   background — no modal, nothing for the person to see.
 * - If permission hasn't been decided yet, shows one friendly pre-prompt
 *   before the OS dialog. Declining sets `hasPromptedOnLaunch` so we don't
 *   nag again on every cold start; address forms still offer their own
 *   "use current location" button for anyone who changes their mind later.
 */
export function useLaunchLocationPrompt() {
  const hasPromptedOnLaunch = useLocationStore((s) => s.hasPromptedOnLaunch);
  const setHasPromptedOnLaunch = useLocationStore((s) => s.setHasPromptedOnLaunch);
  const setLastKnownAddress = useLocationStore((s) => s.setLastKnownAddress);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const ranRef = useRef(false);

  const prefetch = async () => {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const parsed = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      setLastKnownAddress(parsed);
    } catch {
      // No connectivity / GPS timeout — address forms fall back to their own
      // on-demand detection, so there's nothing more to do here.
    }
  };

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        void prefetch();
        return;
      }
      if (!hasPromptedOnLaunch) {
        setPermissionModalVisible(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAllow = () => {
    setPermissionModalVisible(false);
    setHasPromptedOnLaunch(true);
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') void prefetch();
    })();
  };

  const onDeny = () => {
    setPermissionModalVisible(false);
    setHasPromptedOnLaunch(true);
  };

  return { permissionModalVisible, onAllow, onDeny };
}

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ParsedAddress } from '../services/location';

interface LocationState {
  /** Last address resolved from GPS, cached so screens can prefill instantly
   * instead of re-prompting for permission and re-running reverse geocoding. */
  lastKnownAddress: ParsedAddress | null;
  /** Whether we've already shown the launch permission prompt this install,
   * so we only ask once even if the person taps "Not now". */
  hasPromptedOnLaunch: boolean;
  setLastKnownAddress: (address: ParsedAddress | null) => void;
  setHasPromptedOnLaunch: (value: boolean) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      lastKnownAddress: null,
      hasPromptedOnLaunch: false,
      setLastKnownAddress: (lastKnownAddress) => set({ lastKnownAddress }),
      setHasPromptedOnLaunch: (hasPromptedOnLaunch) => set({ hasPromptedOnLaunch }),
    }),
    {
      name: 'lotusmart-location',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

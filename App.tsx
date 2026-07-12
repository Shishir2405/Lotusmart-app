import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from './src/app/providers';
import { RootNavigator } from './src/app/navigation';
import { useInAppUpdate } from './src/hooks/useInAppUpdate';

SplashScreen.preventAutoHideAsync();

export default function App() {
  // Prompt the user to update from the store if a newer version is live.
  useInAppUpdate();

  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <AppProviders onReady={onLayoutRootView}>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </AppProviders>
  );
}

import React from 'react';
import { QueryClient, keepPreviousData } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme, Theme as NavTheme } from '@react-navigation/native';
import { ThemeProvider } from '../../theme/ThemeContext';
import { ToastProvider } from '../../components/ui/Toast';
import { useFonts, fontMap } from '../../config/fonts';
import { SplashScreen } from '../../components/shared/SplashScreen';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';

// gcTime must be >= the persister maxAge below, otherwise inactive queries are
// dropped from the cache before they can be restored on the next cold start.
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24h

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: CACHE_MAX_AGE,
      retry: 1,
      placeholderData: keepPreviousData,
      refetchOnWindowFocus: false,
    },
  },
});

// Persist the React Query cache to AsyncStorage so the last-seen data (categories,
// products, banners) paints instantly on launch, then refreshes in the background.
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

const LightNavigationTheme: NavTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    primary: '#E8567F',
    background: '#FFFDF7',
    card: '#FFFFFF',
    text: '#1C1917',
    border: '#EBE8D8',
    notification: '#E8567F',
  },
};

interface AppProvidersProps {
  children: React.ReactNode;
  onReady?: () => void;
}

export function AppProviders({ children, onReady }: AppProvidersProps) {
  const [fontsLoaded] = useFonts(fontMap);

  if (!fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister, maxAge: CACHE_MAX_AGE }}
      >
        <ThemeProvider>
          <NavigationContainer theme={LightNavigationTheme} onReady={onReady}>
            <ToastProvider>{children}</ToastProvider>
          </NavigationContainer>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}

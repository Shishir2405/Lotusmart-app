import React from 'react';
import { QueryClient, QueryClientProvider, keepPreviousData } from '@tanstack/react-query';
import { NavigationContainer, DefaultTheme, Theme as NavTheme } from '@react-navigation/native';
import { ThemeProvider } from '../../theme/ThemeContext';
import { ToastProvider } from '../../components/ui/Toast';
import { useFonts, fontMap } from '../../config/fonts';
import { SplashScreen } from '../../components/shared/SplashScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      placeholderData: keepPreviousData,
      refetchOnWindowFocus: false,
    },
  },
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavigationContainer theme={LightNavigationTheme} onReady={onReady}>
          <ToastProvider>{children}</ToastProvider>
        </NavigationContainer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

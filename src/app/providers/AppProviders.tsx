import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  Theme as NavTheme,
} from '@react-navigation/native';
import { ThemeProvider, useTheme } from '../../theme/ThemeContext';
import { ToastProvider } from '../../components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const LightNavigationTheme: NavTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    primary: '#E84672',
    background: '#FFFDF7',
    card: '#FFFFFF',
    text: '#1F2937',
    border: '#E5E7EB',
    notification: '#E84672',
  },
};

const DarkNavigationTheme: NavTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    primary: '#E84672',
    background: '#111111',
    card: '#1E1E1E',
    text: '#F9FAFB',
    border: '#374151',
    notification: '#E84672',
  },
};

interface AppProvidersProps {
  children: React.ReactNode;
  onReady?: () => void;
}

function NavigationWrapper({ children, onReady }: AppProvidersProps) {
  const { mode } = useTheme();
  const navigationTheme = mode === 'dark' ? DarkNavigationTheme : LightNavigationTheme;

  return (
    <NavigationContainer theme={navigationTheme} onReady={onReady}>
      {children}
    </NavigationContainer>
  );
}

export function AppProviders({ children, onReady }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavigationWrapper onReady={onReady}>
          <ToastProvider>{children}</ToastProvider>
        </NavigationWrapper>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

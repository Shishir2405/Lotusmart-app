import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import type { Theme } from '../../theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const iconMap: Record<ToastType, string> = {
  success: '\u2713',
  error: '!',
  warning: '\u26A0',
  info: 'i',
};

function getToastColors(
  type: ToastType,
  theme: Theme,
): { bg: string; border: string; text: string; icon: string } {
  switch (type) {
    case 'success':
      return {
        bg: theme.colors.success + '14',
        border: theme.colors.success,
        text: theme.colors.text,
        icon: theme.colors.success,
      };
    case 'error':
      return {
        bg: theme.colors.error + '14',
        border: theme.colors.error,
        text: theme.colors.text,
        icon: theme.colors.error,
      };
    case 'warning':
      return {
        bg: theme.colors.warning + '14',
        border: theme.colors.warning,
        text: theme.colors.text,
        icon: theme.colors.warning,
      };
    case 'info':
      return {
        bg: theme.colors.info + '14',
        border: theme.colors.info,
        text: theme.colors.text,
        icon: theme.colors.info,
      };
  }
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const colors = getToastColors(toast.type, theme);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 5,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss(toast.id);
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, translateY, opacity]);

  return (
    <Animated.View
      style={[
        styles.toastItem,
        {
          backgroundColor: colors.bg,
          borderLeftColor: colors.border,
          borderRadius: theme.borderRadius.md,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: colors.icon + '20' },
        ]}
      >
        <Text style={[styles.iconText, { color: colors.icon }]}>
          {iconMap[toast.type]}
        </Text>
      </View>
      <Text
        style={[
          styles.message,
          { color: colors.text, fontSize: theme.fontSizes.sm },
        ]}
        numberOfLines={2}
      >
        {toast.message}
      </Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idRef = useRef(0);
  let insets = { top: 0 };
  try {
    insets = useSafeAreaInsets();
  } catch {
    // safe area context not available, use default
  }

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View
        style={[
          styles.toastContainer,
          { top: insets.top + (Platform.OS === 'ios' ? 8 : 16) },
        ]}
        pointerEvents="box-none"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    flex: 1,
    fontWeight: '500',
  },
});

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../config/fonts';

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

const toastConfig: Record<
  ToastType,
  { bg: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; textColor: string }
> = {
  success: {
    bg: '#ECFDF5',
    icon: 'checkmark-circle',
    iconColor: '#10B981',
    textColor: '#065F46',
  },
  error: {
    bg: '#FEF2F2',
    icon: 'close-circle',
    iconColor: '#EF4444',
    textColor: '#991B1B',
  },
  warning: {
    bg: '#FFFBEB',
    icon: 'warning',
    iconColor: '#F59E0B',
    textColor: '#92400E',
  },
  info: {
    bg: '#EFF6FF',
    icon: 'information-circle',
    iconColor: '#3B82F6',
    textColor: '#1E40AF',
  },
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = toastConfig[toast.type];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 4,
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
          toValue: -100,
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
          backgroundColor: config.bg,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Ionicons name={config.icon} size={22} color={config.iconColor} />
      <Text
        style={[styles.message, { color: config.textColor, fontFamily: FONTS.body.medium }]}
        numberOfLines={2}
      >
        {toast.message}
      </Text>
      <TouchableOpacity
        onPress={() => onDismiss(toast.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={18} color={config.textColor + '80'} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idRef = useRef(0);
  let insets = { top: 0 };
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    insets = useSafeAreaInsets();
  } catch {
    // safe area context not available
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
        style={[styles.toastContainer, { top: insets.top + (Platform.OS === 'ios' ? 8 : 16) }]}
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
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

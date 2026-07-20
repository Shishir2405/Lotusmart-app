import React, { useCallback, useRef } from 'react';
import { Animated, Linking, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../ui/Toast';

// WhatsApp brand green — intentionally a literal, not a theme token.
const WHATSAPP_GREEN = '#25D366';
const FAB_SIZE = 56;

// Clears the custom tab bar in MainTabNavigator (~66-74pt of chrome above the
// safe-area inset) and is applied on top of insets.bottom, not instead of it.
const DEFAULT_BOTTOM_OFFSET = 84;

interface WhatsAppFabProps {
  phone?: string;
  message?: string;
  bottomOffset?: number;
  visible?: boolean;
}

export function WhatsAppFab({
  phone = '919826040276',
  message = 'Hi! I have a question about LotusMart products.',
  bottomOffset = DEFAULT_BOTTOM_OFFSET,
  visible = true,
}: WhatsAppFabProps) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [scale]);

  const handlePress = useCallback(async () => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    try {
      // wa.me deep-links into WhatsApp when installed and falls back to the
      // browser when it is not, so the https URL is the only one we need.
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showToast('error', 'Unable to open WhatsApp on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      showToast('error', 'Could not open WhatsApp. Please try again.');
    }
  }, [phone, message, showToast]);

  if (!visible) return null;

  const styles = getStyles(theme);

  return (
    <Animated.View
      style={[styles.container, { bottom: insets.bottom + bottomOffset, transform: [{ scale }] }]}
    >
      <Pressable
        style={styles.button}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel="Chat with us on WhatsApp"
        hitSlop={8}
      >
        <Ionicons name="logo-whatsapp" size={30} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

export default WhatsAppFab;

function getStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      right: theme.spacing.lg,
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      backgroundColor: WHATSAPP_GREEN,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
      zIndex: 100,
    },
    button: {
      flex: 1,
      borderRadius: FAB_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

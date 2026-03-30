import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { Theme } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

const sizeMap: Record<ButtonSize, { px: number; py: number; fontSize: number; radius: number }> = {
  sm: { px: 12, py: 6, fontSize: 13, radius: 8 },
  md: { px: 20, py: 10, fontSize: 15, radius: 12 },
  lg: { px: 24, py: 12, fontSize: 16, radius: 12 },
  xl: { px: 32, py: 16, fontSize: 17, radius: 16 },
};

function getVariantStyles(
  variant: ButtonVariant,
  theme: Theme,
): { container: ViewStyle; text: TextStyle; loaderColor: string } {
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: '#E8567F' },
        text: { color: '#FFFFFF' },
        loaderColor: '#FFFFFF',
      };
    case 'secondary':
      return {
        container: { backgroundColor: '#7A6E42' },
        text: { color: '#FFFFFF' },
        loaderColor: '#FFFFFF',
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
        },
        text: { color: theme.colors.primary },
        loaderColor: theme.colors.primary,
      };
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent' },
        text: { color: theme.colors.primary },
        loaderColor: theme.colors.primary,
      };
    case 'danger':
      return {
        container: { backgroundColor: theme.colors.error },
        text: { color: '#FFFFFF' },
        loaderColor: '#FFFFFF',
      };
  }
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled = false,
  children,
  onPress,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const sizeConfig = sizeMap[size];
  const variantStyles = getVariantStyles(variant, theme);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const isDisabled = disabled || isLoading;

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && { width: '100%' },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          {
            paddingHorizontal: sizeConfig.px,
            paddingVertical: sizeConfig.py,
            borderRadius: sizeConfig.radius,
          },
          variantStyles.container,
          isDisabled && styles.disabled,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={variantStyles.loaderColor} />
        ) : (
          <View style={styles.content}>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text
              style={[
                styles.text,
                { fontSize: sizeConfig.fontSize },
                variantStyles.text,
              ]}
            >
              {children}
            </Text>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
});

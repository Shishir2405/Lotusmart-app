import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import type { Theme } from '../../theme';
import { FONTS } from '../../config/fonts';

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
  sm: { px: 14, py: 8, fontSize: 13, radius: 8 },
  md: { px: 20, py: 11, fontSize: 15, radius: 12 },
  lg: { px: 24, py: 14, fontSize: 16, radius: 12 },
  xl: { px: 32, py: 16, fontSize: 17, radius: 16 },
};

function getVariantStyles(
  variant: ButtonVariant,
  theme: Theme,
): { container: ViewStyle; text: TextStyle; loaderColor: string } {
  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: '#E8567F',
          shadowColor: '#E8567F',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 4,
        },
        text: { color: '#FFFFFF' },
        loaderColor: '#FFFFFF',
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: '#7A6E42',
          shadowColor: '#7A6E42',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        },
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
  const scaleAnim = useSharedValue(1);

  const sizeConfig = sizeMap[size];
  const variantStyles = getVariantStyles(variant, theme);

  const handlePressIn = useCallback(() => {
    scaleAnim.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    scaleAnim.value = withSpring(1, { damping: 10, stiffness: 200 });
  }, [scaleAnim]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const isDisabled = disabled || isLoading;

  return (
    <Animated.View style={[animStyle, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        activeOpacity={0.85}
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
                { fontSize: sizeConfig.fontSize, fontFamily: FONTS.body.semiBold },
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

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { Theme } from '../../theme';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

function getVariantStyles(
  variant: BadgeVariant,
  theme: Theme,
): { container: ViewStyle; text: TextStyle } {
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: theme.colors.primary + '18' },
        text: { color: theme.colors.primary },
      };
    case 'secondary':
      return {
        container: { backgroundColor: theme.colors.secondary + '18' },
        text: { color: theme.colors.secondary },
      };
    case 'success':
      return {
        container: { backgroundColor: theme.colors.success + '18' },
        text: { color: theme.colors.success },
      };
    case 'warning':
      return {
        container: { backgroundColor: theme.colors.warning + '18' },
        text: { color: theme.colors.warning },
      };
    case 'error':
      return {
        container: { backgroundColor: theme.colors.error + '18' },
        text: { color: theme.colors.error },
      };
    case 'info':
      return {
        container: { backgroundColor: theme.colors.info + '18' },
        text: { color: theme.colors.info },
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        text: { color: theme.colors.textSecondary },
      };
  }
}

export function Badge({ text, variant = 'primary', size = 'sm' }: BadgeProps) {
  const { theme } = useTheme();
  const variantStyles = getVariantStyles(variant, theme);

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 2 : 4,
          borderRadius: theme.borderRadius.full,
        },
        variantStyles.container,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: isSmall ? theme.fontSizes.xs : theme.fontSizes.sm,
          },
          variantStyles.text,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

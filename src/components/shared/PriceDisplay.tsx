import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { formatCurrency, getDiscountPercentage } from '../../utils/helpers';

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceDisplay({ price, compareAtPrice, size = 'md' }: PriceDisplayProps) {
  const { theme } = useTheme();

  const discount = getDiscountPercentage(price, compareAtPrice);

  const fontSizeMap = {
    sm: theme.fontSizes.sm,
    md: theme.fontSizes.lg,
    lg: theme.fontSizes['2xl'],
  };
  const compareFontSizeMap = {
    sm: theme.fontSizes.xs,
    md: theme.fontSizes.sm,
    lg: theme.fontSizes.base,
  };
  const badgeFontSizeMap = {
    sm: theme.fontSizes.xs - 1,
    md: theme.fontSizes.xs,
    lg: theme.fontSizes.sm,
  };
  const badgePaddingMap = {
    sm: { horizontal: theme.spacing.xs, vertical: 1 },
    md: { horizontal: theme.spacing.sm, vertical: 2 },
    lg: { horizontal: theme.spacing.sm, vertical: theme.spacing.xs },
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    price: {
      fontSize: fontSizeMap[size],
      fontWeight: '700',
      color: theme.colors.text,
    },
    compareAtPrice: {
      fontSize: compareFontSizeMap[size],
      color: theme.colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    discountBadge: {
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: badgePaddingMap[size].horizontal,
      paddingVertical: badgePaddingMap[size].vertical,
      borderRadius: theme.borderRadius.sm,
    },
    discountText: {
      fontSize: badgeFontSizeMap[size],
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.price}>{formatCurrency(price)}</Text>
      {compareAtPrice != null && discount > 0 && (
        <>
          <Text style={styles.compareAtPrice}>{formatCurrency(compareAtPrice)}</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% off</Text>
          </View>
        </>
      )}
    </View>
  );
}

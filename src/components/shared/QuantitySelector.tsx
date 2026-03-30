import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  size = 'md',
}: QuantitySelectorProps) {
  const { theme } = useTheme();
  const isSmall = size === 'sm';

  const buttonSize = isSmall ? 28 : 36;
  const iconSize = isSmall ? 16 : 20;
  const fontSize = isSmall ? theme.fontSizes.sm : theme.fontSizes.base;
  const minWidth = isSmall ? 32 : 40;

  const isAtMin = quantity <= min;
  const isAtMax = quantity >= max;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.sm,
      overflow: 'hidden',
    },
    button: {
      width: buttonSize,
      height: buttonSize,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    quantityText: {
      fontSize,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      minWidth,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.colors.border,
      lineHeight: buttonSize,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isAtMin && styles.buttonDisabled]}
        onPress={onDecrease}
        disabled={isAtMin}
        activeOpacity={0.6}
      >
        <Ionicons
          name="remove"
          size={iconSize}
          color={isAtMin ? theme.colors.textSecondary : theme.colors.primary}
        />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{quantity}</Text>
      <TouchableOpacity
        style={[styles.button, isAtMax && styles.buttonDisabled]}
        onPress={onIncrease}
        disabled={isAtMax}
        activeOpacity={0.6}
      >
        <Ionicons
          name="add"
          size={iconSize}
          color={isAtMax ? theme.colors.textSecondary : theme.colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

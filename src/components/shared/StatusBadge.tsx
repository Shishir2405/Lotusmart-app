import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getOrderStatusColor, getPaymentStatusColor } from '../../utils/helpers';

interface StatusBadgeProps {
  status: string;
  type: 'order' | 'payment';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const color = type === 'order' ? getOrderStatusColor(status) : getPaymentStatusColor(status);

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  const styles = StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
      backgroundColor: color + '1A',
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
      color,
    },
  });

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

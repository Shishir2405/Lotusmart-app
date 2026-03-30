import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Card, Badge } from '../../../components/ui';
import { formatCurrency, formatDate, getOrderStatusColor } from '../../../utils/helpers';
import type { IOrder } from '../../../types';

interface OrderCardProps {
  order: IOrder;
  onPress: () => void;
}

function OrderCardInner({ order, onPress }: OrderCardProps) {
  const { theme } = useTheme();

  const statusColor = getOrderStatusColor(order.orderStatus);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const styles = getStyles(theme);

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.orderInfo}>
          <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
            #{order.orderNumber}
          </Text>
          <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
            {formatDate(order.createdAt)}
          </Text>
        </View>
        <Badge
          text={order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
          variant="outline"
        />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.bottomRow}>
        <View style={styles.summaryInfo}>
          <Text style={[styles.itemCount, { color: theme.colors.textSecondary }]}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
          <Text style={[styles.total, { color: theme.colors.text }]}>
            {formatCurrency(order.total)}
          </Text>
        </View>
        <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.viewDetails, { color: theme.colors.primary }]}>
            View Details
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />
    </Card>
  );
}

export const OrderCard = React.memo(OrderCardInner);

function getStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      padding: theme.spacing.lg,
      overflow: 'hidden',
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    orderInfo: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    orderNumber: {
      fontSize: theme.fontSizes.base,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    date: {
      fontSize: theme.fontSizes.xs,
      marginTop: theme.spacing.xs,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: theme.spacing.md,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryInfo: {
      flex: 1,
    },
    itemCount: {
      fontSize: theme.fontSizes.sm,
    },
    total: {
      fontSize: theme.fontSizes.lg,
      fontWeight: '700',
      marginTop: theme.spacing.xs,
    },
    viewDetails: {
      fontSize: theme.fontSizes.sm,
      fontWeight: '600',
    },
    statusStrip: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 4,
      height: '100%',
      borderTopLeftRadius: theme.borderRadius.md,
      borderBottomLeftRadius: theme.borderRadius.md,
    },
  });
}

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { formatCurrency, formatDate, getOrderStatusColor } from '../../../utils/helpers';
import type { IOrder } from '../../../types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

interface OrderCardProps {
  order: IOrder;
  onPress: () => void;
  index?: number;
}

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  placed: 'receipt-outline',
  confirmed: 'checkmark-circle-outline',
  processing: 'cog-outline',
  shipped: 'car-outline',
  delivered: 'checkmark-done-circle-outline',
  cancelled: 'close-circle-outline',
  returned: 'refresh-outline',
};

function OrderCardInner({ order, onPress, index = 0 }: OrderCardProps) {
  const { theme } = useTheme();

  const statusColor = getOrderStatusColor(order.orderStatus);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const statusLabel = order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1);
  const statusIcon = STATUS_ICONS[order.orderStatus] || 'ellipse-outline';

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(300)}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
          },
        ]}
      >
        {/* Status strip */}
        <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />

        {/* Header */}
        <View style={styles.topRow}>
          <View style={styles.orderInfo}>
            <Text
              style={[
                styles.orderNumber,
                { color: theme.colors.text, fontFamily: FONTS.body.bold },
              ]}
            >
              #{order.orderNumber}
            </Text>
            <Text
              style={[
                styles.date,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              {formatDate(order.createdAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Ionicons name={statusIcon} size={14} color={statusColor} />
            <Text
              style={[styles.statusText, { color: statusColor, fontFamily: FONTS.body.semiBold }]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Bottom */}
        <View style={styles.bottomRow}>
          <View>
            <Text
              style={[
                styles.itemCount,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
            <Text
              style={[styles.total, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
            >
              {formatCurrency(order.total)}
            </Text>
          </View>
          <View style={styles.viewBtn}>
            <Text
              style={[styles.viewText, { color: COLORS.rose, fontFamily: FONTS.body.semiBold }]}
            >
              View Details
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.rose} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export const OrderCard = React.memo(OrderCardInner);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: { flex: 1, marginRight: 8 },
  orderNumber: { fontSize: 15, letterSpacing: 0.2 },
  date: { fontSize: 12, marginTop: 3 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  statusText: { fontSize: 12 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: { fontSize: 13 },
  total: { fontSize: 18, marginTop: 2 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontSize: 13 },
});

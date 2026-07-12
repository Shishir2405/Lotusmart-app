import React, { useCallback } from 'react';
import { View, Text, ScrollView, Image, Alert, StyleSheet, SafeAreaView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeContext';
import { Card, Badge, Button, Skeleton } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { EmptyState } from '../../../components/shared/EmptyState';
import { useOrder, useCancelOrder } from '../hooks';
import {
  formatCurrency,
  formatDate,
  getOrderStatusColor,
  getPaymentStatusColor,
} from '../../../utils/helpers';
import type { IOrder, OrderStatus } from '../../../types';
import type { OrderStackParamList } from '../types';

const STATUS_STEPS: OrderStatus[] = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

function getStepIndex(status: OrderStatus): number {
  const idx = STATUS_STEPS.indexOf(status);
  return idx >= 0 ? idx : -1;
}

export default function OrderDetailScreen() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const route = useRoute<RouteProp<OrderStackParamList, 'OrderDetail'>>();
  const { orderId } = route.params;

  const { data, isLoading, refetch } = useOrder(orderId);
  const cancelMutation = useCancelOrder();

  const order = data?.data as IOrder | undefined;

  const styles = getStyles(theme);

  const handleCancelOrder = useCallback(() => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: () => {
            cancelMutation.mutate(orderId, {
              onSuccess: () => {
                showToast('success', 'Order cancelled successfully');
                refetch();
              },
              onError: () => {
                showToast('error', 'Failed to cancel order. Please try again.');
              },
            });
          },
        },
      ],
    );
  }, [orderId, cancelMutation, showToast, refetch]);

  if (!order) {
    // Loaded but no order = fetch error / not found. Show a retry, not an endless skeleton.
    if (!isLoading) {
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load order"
            description="Please check your connection and try again."
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Skeleton width="70%" height={22} />
            <Skeleton width={90} height={26} borderRadius={13} style={{ marginTop: 12 }} />
          </View>
          <View style={styles.section}>
            <Skeleton width="40%" height={18} style={{ marginBottom: 16 }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
              >
                <Skeleton width={20} height={20} borderRadius={10} />
                <Skeleton width="50%" height={14} style={{ marginLeft: 16 }} />
              </View>
            ))}
          </View>
          <View style={styles.section}>
            <Skeleton width="30%" height={18} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={70} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentStepIndex = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';
  const canCancel = order.orderStatus === 'placed' || order.orderStatus === 'confirmed';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
                #{order.orderNumber}
              </Text>
              <Text style={[styles.orderDate, { color: theme.colors.textSecondary }]}>
                {formatDate(order.createdAt)}
              </Text>
            </View>
            <Badge
              text={order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
              variant="outline"
            />
          </View>
        </View>

        {/* Status Timeline */}
        {!isCancelled && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order Status</Text>
            <View style={styles.timeline}>
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isActive = index === currentStepIndex;
                const circleColor = isCompleted ? theme.colors.primary : theme.colors.border;
                const lineColor =
                  index < currentStepIndex ? theme.colors.primary : theme.colors.border;
                const isLast = index === STATUS_STEPS.length - 1;

                return (
                  <View key={step} style={styles.timelineStep}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineCircle,
                          {
                            backgroundColor: isCompleted ? circleColor : 'transparent',
                            borderColor: circleColor,
                          },
                          isActive && styles.timelineCircleActive,
                        ]}
                      >
                        {isCompleted && <Text style={styles.checkmark}>{'\u2713'}</Text>}
                      </View>
                      {!isLast && (
                        <View style={[styles.timelineLine, { backgroundColor: lineColor }]} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineLabel,
                          {
                            color: isCompleted ? theme.colors.text : theme.colors.textSecondary,
                            fontWeight: isActive ? '700' : '500',
                          },
                        ]}
                      >
                        {STATUS_LABELS[step]}
                      </Text>
                      {isCompleted && step === 'placed' && (
                        <Text style={[styles.timelineDate, { color: theme.colors.textSecondary }]}>
                          {formatDate(order.createdAt)}
                        </Text>
                      )}
                      {isCompleted && step === 'delivered' && order.deliveredAt && (
                        <Text style={[styles.timelineDate, { color: theme.colors.textSecondary }]}>
                          {formatDate(order.deliveredAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {isCancelled && (
          <View style={styles.section}>
            <View style={[styles.cancelledBanner, { backgroundColor: theme.colors.error + '10' }]}>
              <Text style={[styles.cancelledText, { color: theme.colors.error }]}>
                Order was cancelled
                {order.cancelledAt ? ` on ${formatDate(order.cancelledAt)}` : ''}
              </Text>
              {order.cancelReason && (
                <Text style={[styles.cancelReason, { color: theme.colors.textSecondary }]}>
                  Reason: {order.cancelReason}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Tracking Number */}
        {order.trackingNumber && (
          <View style={styles.section}>
            <Card>
              <View style={styles.trackingRow}>
                <Text style={[styles.trackingLabel, { color: theme.colors.textSecondary }]}>
                  Tracking Number
                </Text>
                <Text style={[styles.trackingValue, { color: theme.colors.text }]}>
                  {order.trackingNumber}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Items */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Items</Text>
          {order.items.map((item, index) => (
            <View
              key={`${item.product}-${index}`}
              style={[
                styles.itemRow,
                index < order.items.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              <Image
                source={{ uri: item.image }}
                style={[styles.itemImage, { backgroundColor: theme.colors.border }]}
              />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.variant && (
                  <Text style={[styles.itemVariant, { color: theme.colors.textSecondary }]}>
                    {item.variant}
                  </Text>
                )}
                <Text style={[styles.itemQtyPrice, { color: theme.colors.textSecondary }]}>
                  {item.quantity} x {formatCurrency(item.price)}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: theme.colors.text }]}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Shipping Address</Text>
          <Card>
            <Text style={[styles.addressName, { color: theme.colors.text }]}>
              {order.shippingAddress.fullName}
            </Text>
            <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
              {order.shippingAddress.addressLine1}
            </Text>
            {order.shippingAddress.addressLine2 && (
              <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
                {order.shippingAddress.addressLine2}
              </Text>
            )}
            <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
              {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
              {order.shippingAddress.pincode}
            </Text>
            <Text style={[styles.addressPhone, { color: theme.colors.textSecondary }]}>
              Phone: {order.shippingAddress.phone}
            </Text>
          </Card>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Payment</Text>
          <Card>
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: theme.colors.textSecondary }]}>
                Method
              </Text>
              <Text style={[styles.paymentValue, { color: theme.colors.text }]}>
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}
              </Text>
            </View>
            <View style={[styles.paymentRow, { marginTop: theme.spacing.sm }]}>
              <Text style={[styles.paymentLabel, { color: theme.colors.textSecondary }]}>
                Status
              </Text>
              <Badge
                text={order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                variant="outline"
              />
            </View>
          </Card>
        </View>

        {/* Price Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Price Details</Text>
          <Card>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
                Subtotal
              </Text>
              <Text style={[styles.priceValue, { color: theme.colors.text }]}>
                {formatCurrency(order.subtotal)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
                Shipping
              </Text>
              <Text
                style={[
                  styles.priceValue,
                  { color: order.shippingCost === 0 ? theme.colors.success : theme.colors.text },
                ]}
              >
                {order.shippingCost === 0 ? 'FREE' : formatCurrency(order.shippingCost)}
              </Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
                  Discount
                </Text>
                <Text style={[styles.priceValue, { color: theme.colors.success }]}>
                  -{formatCurrency(order.discount)}
                </Text>
              </View>
            )}
            <View style={[styles.totalDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.priceRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                {formatCurrency(order.total)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <View style={styles.cancelSection}>
            <Button
              variant="danger"
              fullWidth
              onPress={handleCancelOrder}
              isLoading={cancelMutation.isPending}
            >
              Cancel Order
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing['3xl'] + 16,
    },
    section: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingTop: theme.spacing.lg,
    },
    orderNumber: {
      fontSize: theme.fontSizes['2xl'],
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    orderDate: {
      fontSize: theme.fontSizes.sm,
      marginTop: theme.spacing.xs,
    },
    sectionTitle: {
      fontSize: theme.fontSizes.lg,
      fontWeight: '700',
      marginBottom: theme.spacing.md,
    },

    // Timeline
    timeline: {
      paddingLeft: theme.spacing.xs,
    },
    timelineStep: {
      flexDirection: 'row',
      minHeight: 52,
    },
    timelineLeft: {
      alignItems: 'center',
      width: 24,
    },
    timelineCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineCircleActive: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 3,
    },
    checkmark: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    timelineLine: {
      width: 2,
      flex: 1,
      marginVertical: 4,
    },
    timelineContent: {
      marginLeft: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    timelineLabel: {
      fontSize: theme.fontSizes.sm,
    },
    timelineDate: {
      fontSize: theme.fontSizes.xs,
      marginTop: 2,
    },

    // Cancelled
    cancelledBanner: {
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
    },
    cancelledText: {
      fontSize: theme.fontSizes.sm,
      fontWeight: '600',
    },
    cancelReason: {
      fontSize: theme.fontSizes.xs,
      marginTop: theme.spacing.xs,
    },

    // Tracking
    trackingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    trackingLabel: {
      fontSize: theme.fontSizes.sm,
    },
    trackingValue: {
      fontSize: theme.fontSizes.sm,
      fontWeight: '600',
      letterSpacing: 0.5,
    },

    // Items
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    itemImage: {
      width: 60,
      height: 60,
      borderRadius: theme.borderRadius.sm,
    },
    itemInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
      marginRight: theme.spacing.sm,
    },
    itemName: {
      fontSize: theme.fontSizes.sm,
      fontWeight: '600',
      lineHeight: 20,
    },
    itemVariant: {
      fontSize: theme.fontSizes.xs,
      marginTop: 2,
    },
    itemQtyPrice: {
      fontSize: theme.fontSizes.xs,
      marginTop: theme.spacing.xs,
    },
    itemTotal: {
      fontSize: theme.fontSizes.sm,
      fontWeight: '700',
    },

    // Address
    addressName: {
      fontSize: theme.fontSizes.base,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    addressLine: {
      fontSize: theme.fontSizes.sm,
      lineHeight: 22,
    },
    addressPhone: {
      fontSize: theme.fontSizes.sm,
      marginTop: theme.spacing.xs,
    },

    // Payment
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    paymentLabel: {
      fontSize: theme.fontSizes.sm,
    },
    paymentValue: {
      fontSize: theme.fontSizes.sm,
      fontWeight: '600',
    },

    // Price Details
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    priceLabel: {
      fontSize: theme.fontSizes.sm,
    },
    priceValue: {
      fontSize: theme.fontSizes.sm,
      fontWeight: '500',
    },
    totalDivider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: theme.spacing.md,
    },
    totalLabel: {
      fontSize: theme.fontSizes.base,
      fontWeight: '700',
    },
    totalValue: {
      fontSize: theme.fontSizes.lg,
      fontWeight: '700',
    },

    // Cancel
    cancelSection: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing['3xl'],
    },
  });
}

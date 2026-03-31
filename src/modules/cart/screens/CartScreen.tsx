import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { useCartStore } from '../../../store/cart.store';
import { useAuthStore } from '../../../store/auth.store';
import { formatCurrency, getShippingCost } from '../../../utils/helpers';
import { FREE_SHIPPING_THRESHOLD } from '../../../config/constants';
import { CartItem } from '../components/CartItem';
import { CartStackParamList } from '../types';
import { ICartItem } from '../../../types';

type CartNavProp = NativeStackNavigationProp<CartStackParamList, 'Cart'>;

export default function CartScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<CartNavProp>();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const {
    items,
    couponCode,
    discount,
    getSubtotal,
    getTotal,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');

  const subtotal = getSubtotal();
  const shippingCost = getShippingCost(subtotal);
  const total = getTotal() + shippingCost;

  const handleApplyCoupon = useCallback(() => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      showToast('error', 'Please enter a coupon code');
      return;
    }
    // Placeholder: In a real app, validate via API
    applyCoupon(code, 50);
    showToast('success', `Coupon "${code}" applied!`);
    setCouponInput('');
  }, [couponInput, applyCoupon, showToast]);

  const handleRemoveCoupon = useCallback(() => {
    removeCoupon();
    showToast('info', 'Coupon removed');
  }, [removeCoupon, showToast]);

  const handleCheckout = useCallback(() => {
    // Allow both logged-in and guest checkout
    navigation.navigate('Checkout');
  }, [navigation]);

  const handleShopNow = useCallback(() => {
    (navigation as any).navigate('Products', { screen: 'Home' });
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: ICartItem }) => <CartItem item={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: ICartItem) =>
      item.variant ? `${item.productId}-${item.variant}` : item.productId,
    [],
  );

  if (items.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyIcon, { color: theme.colors.border }]}>
            {/* Cart icon placeholder */}
            Cart
          </Text>
          <Text
            style={[
              styles.emptyTitle,
              { color: theme.colors.text, fontSize: theme.fontSizes['2xl'] },
            ]}
          >
            Your cart is empty
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.fontSizes.sm,
              },
            ]}
          >
            Looks like you haven't added anything to your cart yet
          </Text>
          <Button size="lg" onPress={handleShopNow}>
            Shop Now
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const ListFooterComponent = () => (
    <View style={styles.footer}>
      {/* Coupon Section */}
      <View
        style={[
          styles.couponContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
          },
        ]}
      >
        {couponCode ? (
          <View style={styles.couponApplied}>
            <View style={styles.couponAppliedLeft}>
              <Text
                style={[
                  styles.couponLabel,
                  { color: theme.colors.success, fontSize: theme.fontSizes.sm },
                ]}
              >
                Coupon Applied
              </Text>
              <Text
                style={[
                  styles.couponCodeText,
                  { color: theme.colors.text, fontSize: theme.fontSizes.sm },
                ]}
              >
                {couponCode} (-{formatCurrency(discount)})
              </Text>
            </View>
            <TouchableOpacity onPress={handleRemoveCoupon}>
              <Text
                style={[
                  styles.couponRemove,
                  { color: theme.colors.error, fontSize: theme.fontSizes.sm },
                ]}
              >
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.couponInputRow}>
            <TextInput
              style={[
                styles.couponInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.sm,
                  fontSize: theme.fontSizes.sm,
                },
              ]}
              placeholder="Enter coupon code"
              placeholderTextColor={theme.colors.textSecondary}
              value={couponInput}
              onChangeText={setCouponInput}
              autoCapitalize="characters"
            />
            <Button size="sm" variant="outline" onPress={handleApplyCoupon}>
              Apply
            </Button>
          </View>
        )}
      </View>

      {/* Order Summary */}
      <View
        style={[
          styles.summaryContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
          },
        ]}
      >
        <Text
          style={[
            styles.summaryTitle,
            { color: theme.colors.text, fontSize: theme.fontSizes.lg },
          ]}
        >
          Order Summary
        </Text>

        <View style={styles.summaryRow}>
          <Text
            style={[
              styles.summaryLabel,
              { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm },
            ]}
          >
            Subtotal ({items.length} items)
          </Text>
          <Text
            style={[
              styles.summaryValue,
              { color: theme.colors.text, fontSize: theme.fontSizes.sm },
            ]}
          >
            {formatCurrency(subtotal)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text
            style={[
              styles.summaryLabel,
              { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm },
            ]}
          >
            Shipping
          </Text>
          <Text
            style={[
              styles.summaryValue,
              {
                color:
                  shippingCost === 0
                    ? theme.colors.success
                    : theme.colors.text,
                fontSize: theme.fontSizes.sm,
              },
            ]}
          >
            {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
          </Text>
        </View>

        {shippingCost > 0 && (
          <Text
            style={[
              styles.freeShippingHint,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.fontSizes.xs,
              },
            ]}
          >
            Add {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} more for
            free shipping
          </Text>
        )}

        {discount > 0 && (
          <View style={styles.summaryRow}>
            <Text
              style={[
                styles.summaryLabel,
                {
                  color: theme.colors.success,
                  fontSize: theme.fontSizes.sm,
                },
              ]}
            >
              Discount
            </Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color: theme.colors.success,
                  fontSize: theme.fontSizes.sm,
                },
              ]}
            >
              -{formatCurrency(discount)}
            </Text>
          </View>
        )}

        <View
          style={[styles.divider, { borderTopColor: theme.colors.border }]}
        />

        <View style={styles.summaryRow}>
          <Text
            style={[
              styles.totalLabel,
              { color: theme.colors.text, fontSize: theme.fontSizes.base },
            ]}
          >
            Total
          </Text>
          <Text
            style={[
              styles.totalValue,
              { color: theme.colors.primary, fontSize: theme.fontSizes.xl },
            ]}
          >
            {formatCurrency(total)}
          </Text>
        </View>
      </View>

      {/* Checkout Button */}
      <View style={styles.checkoutButtonContainer}>
        <Button size="lg" fullWidth onPress={handleCheckout}>
          Proceed to Checkout
        </Button>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  couponContainer: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: '500',
  },
  couponApplied: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponAppliedLeft: {
    flex: 1,
  },
  couponLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  couponCodeText: {
    fontWeight: '500',
  },
  couponRemove: {
    fontWeight: '600',
  },
  summaryContainer: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontWeight: '400',
  },
  summaryValue: {
    fontWeight: '600',
  },
  freeShippingHint: {
    fontWeight: '400',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontWeight: '700',
  },
  totalValue: {
    fontWeight: '700',
  },
  checkoutButtonContainer: {
    marginBottom: 16,
  },
});

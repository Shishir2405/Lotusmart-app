import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { useCartStore } from '../../../store/cart.store';
import { formatCurrency, getShippingCost } from '../../../utils/helpers';
import { FREE_SHIPPING_THRESHOLD, COLORS } from '../../../config/constants';
import { CartItem } from '../components/CartItem';
import { ICartItem } from '../../../types';
import { FONTS } from '../../../config/fonts';

export default function CartScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const { showToast } = useToast();
  const { items, couponCode, discount, getSubtotal, getTotal, applyCoupon, removeCoupon } =
    useCartStore();

  const [couponInput, setCouponInput] = useState('');

  const subtotal = getSubtotal();
  const shippingCost = getShippingCost(subtotal);
  const total = getTotal() + shippingCost;
  const freeShippingProgress = Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1);

  const handleApplyCoupon = useCallback(() => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      showToast('error', 'Please enter a coupon code');
      return;
    }
    applyCoupon(code, 50);
    showToast('success', `Coupon "${code}" applied!`);
    setCouponInput('');
  }, [couponInput, applyCoupon, showToast]);

  const handleRemoveCoupon = useCallback(() => {
    removeCoupon();
    showToast('info', 'Coupon removed');
  }, [removeCoupon, showToast]);

  const handleCheckout = useCallback(() => {
    navigation.navigate('Checkout');
  }, [navigation]);

  const handleShopNow = useCallback(() => {
    navigation.navigate('Main', { screen: 'HomeTab' });
  }, [navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: ICartItem; index: number }) => <CartItem item={item} index={index} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: ICartItem) => (item.variant ? `${item.productId}-${item.variant}` : item.productId),
    [],
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <Animated.View
            entering={FadeIn.duration(500)}
            style={[styles.emptyIconCircle, { backgroundColor: COLORS.roseLight }]}
          >
            <Ionicons name="cart-outline" size={48} color={COLORS.rose} />
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.delay(200).duration(400)}
            style={[
              styles.emptyTitle,
              { color: theme.colors.text, fontFamily: FONTS.heading.bold },
            ]}
          >
            Your cart is empty
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(300).duration(400)}
            style={[
              styles.emptySubtitle,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
            ]}
          >
            {"Looks like you haven't added anything to your cart yet"}
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Button size="lg" onPress={handleShopNow}>
              Start Shopping
            </Button>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const ListHeaderComponent = () => (
    <View style={styles.headerSection}>
      <Text
        style={[styles.headerTitle, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
      >
        Shopping Cart
      </Text>
      <View style={[styles.itemCountBadge, { backgroundColor: COLORS.rose + '18' }]}>
        <Text
          style={[styles.itemCountText, { color: COLORS.rose, fontFamily: FONTS.body.semiBold }]}
        >
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
    </View>
  );

  const ListFooterComponent = () => (
    <View style={styles.footer}>
      {/* Free shipping progress */}
      {shippingCost > 0 && (
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={[
            styles.shippingProgress,
            { backgroundColor: COLORS.oliveLight, borderRadius: 12 },
          ]}
        >
          <View style={styles.shippingProgressHeader}>
            <Ionicons name="car-outline" size={16} color={COLORS.olive} />
            <Text style={{ fontSize: 13, color: COLORS.olive, fontFamily: FONTS.body.medium }}>
              Add {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: COLORS.olive + '30' }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${freeShippingProgress * 100}%`, backgroundColor: COLORS.olive },
              ]}
            />
          </View>
        </Animated.View>
      )}

      {/* Coupon Section */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(300)}
        style={[
          styles.couponContainer,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        {couponCode ? (
          <View style={styles.couponApplied}>
            <View style={styles.couponAppliedLeft}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <View style={{ marginLeft: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.success,
                    fontFamily: FONTS.body.semiBold,
                  }}
                >
                  Coupon Applied
                </Text>
                <Text
                  style={{ fontSize: 12, color: theme.colors.text, fontFamily: FONTS.body.regular }}
                >
                  {couponCode} (-{formatCurrency(discount)})
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleRemoveCoupon} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={22} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.couponInputRow}>
            <Ionicons name="pricetag-outline" size={18} color={theme.colors.textSecondary} />
            <TextInput
              style={[
                styles.couponInput,
                { color: theme.colors.text, fontFamily: FONTS.body.regular },
              ]}
              placeholder="Enter coupon code"
              placeholderTextColor={theme.colors.textSecondary}
              value={couponInput}
              onChangeText={setCouponInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: COLORS.rose + '14' }]}
              onPress={handleApplyCoupon}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, color: COLORS.rose, fontFamily: FONTS.body.bold }}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Order Summary */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(300)}
        style={[
          styles.summaryContainer,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text
          style={[
            styles.summaryTitle,
            { color: theme.colors.text, fontFamily: FONTS.heading.semiBold },
          ]}
        >
          Order Summary
        </Text>

        <View style={styles.summaryRow}>
          <Text
            style={[
              styles.summaryLabel,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
            ]}
          >
            Subtotal ({items.length} items)
          </Text>
          <Text
            style={[
              styles.summaryValue,
              { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
            ]}
          >
            {formatCurrency(subtotal)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text
            style={[
              styles.summaryLabel,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
            ]}
          >
            Shipping
          </Text>
          <Text
            style={[
              styles.summaryValue,
              {
                color: shippingCost === 0 ? theme.colors.success : theme.colors.text,
                fontFamily: FONTS.body.semiBold,
              },
            ]}
          >
            {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
          </Text>
        </View>

        {discount > 0 && (
          <View style={styles.summaryRow}>
            <Text
              style={{ fontSize: 14, color: theme.colors.success, fontFamily: FONTS.body.regular }}
            >
              Discount
            </Text>
            <Text
              style={{ fontSize: 14, color: theme.colors.success, fontFamily: FONTS.body.semiBold }}
            >
              -{formatCurrency(discount)}
            </Text>
          </View>
        )}

        <View style={[styles.divider, { borderTopColor: theme.colors.border }]} />

        <View style={styles.summaryRow}>
          <Text style={{ fontSize: 16, color: theme.colors.text, fontFamily: FONTS.heading.bold }}>
            Total
          </Text>
          <Text style={{ fontSize: 22, color: COLORS.rose, fontFamily: FONTS.heading.bold }}>
            {formatCurrency(total)}
          </Text>
        </View>
      </Animated.View>

      {/* Checkout Button */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(300)}
        style={styles.checkoutBtnContainer}
      >
        <TouchableOpacity
          onPress={handleCheckout}
          activeOpacity={0.85}
          style={{ borderRadius: 14, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={[COLORS.rose, COLORS.roseDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutBtn}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  listContent: { paddingTop: 8, paddingBottom: 32 },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  headerTitle: { fontSize: 24 },
  itemCountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  itemCountText: { fontSize: 12 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  footer: { paddingHorizontal: 16, paddingTop: 8 },
  shippingProgress: { padding: 14, marginBottom: 14 },
  shippingProgressHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  couponContainer: { padding: 14, borderWidth: 1, borderRadius: 12, marginBottom: 14 },
  couponInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  couponInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  applyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  couponApplied: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  couponAppliedLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  summaryContainer: { padding: 16, borderWidth: 1, borderRadius: 12, marginBottom: 14 },
  summaryTitle: { fontSize: 17, marginBottom: 14 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14 },
  divider: { borderTopWidth: 1, marginVertical: 10 },
  checkoutBtnContainer: { marginBottom: 16 },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.body.bold },
});

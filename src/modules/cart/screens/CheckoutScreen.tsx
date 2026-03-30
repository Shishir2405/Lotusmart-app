import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import RazorpayCheckout from 'react-native-razorpay';
import { useTheme } from '../../../theme/ThemeContext';
import { Button, Card, Input } from '../../../components/ui';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { useCartStore } from '../../../store/cart.store';
import { useAuthStore } from '../../../store/auth.store';
import { useAddresses, useCreateAddress } from '../../auth/hooks';
import { useCreateOrder } from '../../orders/hooks';
import { useCreateRazorpayOrder, useVerifyPayment } from '../../payments/hooks';
import { addressSchema, AddressFormData } from '../../../utils/validators';
import { formatCurrency, getShippingCost } from '../../../utils/helpers';
import {
  FREE_SHIPPING_THRESHOLD,
  RAZORPAY_KEY,
} from '../../../config/constants';
import { IAddress, PaymentMethod } from '../../../types';
import { RazorpaySuccessResponse } from '../../payments/types';

type CheckoutNavigation = NativeStackNavigationProp<any>;

export function CheckoutScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<CheckoutNavigation>();
  const { showToast } = useToast();

  const user = useAuthStore((s) => s.user);
  const cartItems = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const discount = useCartStore((s) => s.discount);
  const couponCode = useCartStore((s) => s.couponCode);
  const clearCart = useCartStore((s) => s.clearCart);

  const { data: addressesRes, isLoading: addressesLoading } = useAddresses();
  const addresses: IAddress[] = addressesRes?.data ?? [];

  const createAddressMutation = useCreateAddress();
  const createOrderMutation = useCreateOrder();
  const createRazorpayOrderMutation = useCreateRazorpayOrder();
  const verifyPaymentMutation = useVerifyPayment();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Auto-select default address
  React.useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(defaultAddr._id ?? null);
    }
  }, [addresses, selectedAddressId]);

  const shippingCost = useMemo(() => getShippingCost(subtotal), [subtotal]);
  const total = useMemo(
    () => Math.max(0, subtotal + shippingCost - discount),
    [subtotal, shippingCost, discount],
  );

  const selectedAddress = useMemo(
    () => addresses.find((a) => a._id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  // Address Form
  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    },
  });

  const handleAddAddress = useCallback(
    async (data: AddressFormData) => {
      try {
        await createAddressMutation.mutateAsync(data);
        showToast('success', 'Address added successfully');
        setAddressModalVisible(false);
        resetForm();
      } catch {
        showToast('error', 'Failed to add address');
      }
    },
    [createAddressMutation, showToast, resetForm],
  );

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedAddress) {
      showToast('error', 'Please select a shipping address');
      return;
    }

    if (cartItems.length === 0) {
      showToast('error', 'Your cart is empty');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderItems = cartItems.map((item) => ({
        product: item.productId,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant,
      }));

      if (paymentMethod === 'cod') {
        const orderRes = await createOrderMutation.mutateAsync({
          items: orderItems,
          shippingAddress: selectedAddress,
          paymentMethod: 'cod',
          couponCode: couponCode ?? undefined,
        });

        clearCart();
        showToast('success', 'Order placed successfully!');

        const orderId = orderRes.data?._id;
        if (orderId) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            }),
          );
        }
      } else {
        // Razorpay flow
        const orderRes = await createOrderMutation.mutateAsync({
          items: orderItems,
          shippingAddress: selectedAddress,
          paymentMethod: 'razorpay',
          couponCode: couponCode ?? undefined,
        });

        const order = orderRes.data;
        if (!order) {
          showToast('error', 'Failed to create order');
          return;
        }

        const razorpayRes = await createRazorpayOrderMutation.mutateAsync({
          amount: order.total,
          orderId: order._id,
        });

        const razorpayData = razorpayRes.data;
        if (!razorpayData) {
          showToast('error', 'Failed to initiate payment');
          return;
        }

        const options = {
          key: RAZORPAY_KEY,
          amount: razorpayData.amount,
          currency: razorpayData.currency,
          name: 'LotusMart',
          description: `Order #${order.orderNumber}`,
          order_id: razorpayData.razorpayOrderId,
          prefill: {
            name: user?.name ?? '',
            email: user?.email ?? '',
            contact: user?.phone ?? '',
          },
          theme: { color: '#E8567F' },
        };

        const paymentResponse: RazorpaySuccessResponse =
          await RazorpayCheckout.open(options);

        await verifyPaymentMutation.mutateAsync({
          orderId: order._id,
          paymentId: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature,
        });

        clearCart();
        showToast('success', 'Payment successful! Order placed.');

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          }),
        );
      }
    } catch (error: any) {
      const message =
        error?.description ?? error?.message ?? 'Something went wrong';
      showToast('error', message);
    } finally {
      setIsPlacingOrder(false);
    }
  }, [
    selectedAddress,
    cartItems,
    paymentMethod,
    couponCode,
    user,
    createOrderMutation,
    createRazorpayOrderMutation,
    verifyPaymentMutation,
    clearCart,
    showToast,
    navigation,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.flex, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section 1: Shipping Address */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, fontSize: theme.fontSizes.lg },
            ]}
          >
            Shipping Address
          </Text>

          {addressesLoading ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={styles.loader}
            />
          ) : addresses.length === 0 ? (
            <View
              style={[
                styles.emptyAddress,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={32}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.emptyAddressText,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSizes.sm,
                  },
                ]}
              >
                No saved addresses
              </Text>
            </View>
          ) : (
            addresses.map((address) => {
              const isSelected = selectedAddressId === address._id;
              return (
                <TouchableOpacity
                  key={address._id}
                  activeOpacity={0.7}
                  onPress={() => setSelectedAddressId(address._id ?? null)}
                >
                  <Card>
                    <View
                      style={[
                        styles.addressCard,
                        isSelected && {
                          borderColor: theme.colors.primary,
                          borderWidth: 2,
                          borderRadius: theme.borderRadius.md,
                        },
                        !isSelected && {
                          borderColor: theme.colors.border,
                          borderWidth: 1,
                          borderRadius: theme.borderRadius.md,
                        },
                      ]}
                    >
                      <View style={styles.radioRow}>
                        <View
                          style={[
                            styles.radioOuter,
                            {
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.border,
                            },
                          ]}
                        >
                          {isSelected && (
                            <View
                              style={[
                                styles.radioInner,
                                { backgroundColor: theme.colors.primary },
                              ]}
                            />
                          )}
                        </View>
                        <View style={styles.addressDetails}>
                          <Text
                            style={[
                              styles.addressName,
                              {
                                color: theme.colors.text,
                                fontSize: theme.fontSizes.base,
                              },
                            ]}
                          >
                            {address.fullName}
                          </Text>
                          <Text
                            style={[
                              styles.addressLine,
                              {
                                color: theme.colors.textSecondary,
                                fontSize: theme.fontSizes.sm,
                              },
                            ]}
                          >
                            {address.addressLine1}
                            {address.addressLine2
                              ? `, ${address.addressLine2}`
                              : ''}
                          </Text>
                          <Text
                            style={[
                              styles.addressLine,
                              {
                                color: theme.colors.textSecondary,
                                fontSize: theme.fontSizes.sm,
                              },
                            ]}
                          >
                            {address.city}, {address.state} - {address.pincode}
                          </Text>
                          <Text
                            style={[
                              styles.addressPhone,
                              {
                                color: theme.colors.textSecondary,
                                fontSize: theme.fontSizes.sm,
                              },
                            ]}
                          >
                            {address.phone}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}

          <Button
            variant="outline"
            size="md"
            fullWidth
            onPress={() => setAddressModalVisible(true)}
            leftIcon={
              <Ionicons name="add" size={18} color={theme.colors.primary} />
            }
          >
            Add New Address
          </Button>
        </View>

        {/* Section 2: Payment Method */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, fontSize: theme.fontSizes.lg },
            ]}
          >
            Payment Method
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPaymentMethod('cod')}
          >
            <View
              style={[
                styles.paymentCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  borderColor:
                    paymentMethod === 'cod'
                      ? theme.colors.primary
                      : theme.colors.border,
                  borderWidth: paymentMethod === 'cod' ? 2 : 1,
                },
              ]}
            >
              <View style={styles.radioRow}>
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor:
                        paymentMethod === 'cod'
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                  ]}
                >
                  {paymentMethod === 'cod' && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>
                <Ionicons
                  name="cash-outline"
                  size={24}
                  color={
                    paymentMethod === 'cod'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                  style={styles.paymentIcon}
                />
                <View style={styles.flex}>
                  <Text
                    style={[
                      styles.paymentLabel,
                      {
                        color: theme.colors.text,
                        fontSize: theme.fontSizes.base,
                      },
                    ]}
                  >
                    Cash on Delivery
                  </Text>
                  <Text
                    style={[
                      styles.paymentHint,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.fontSizes.xs,
                      },
                    ]}
                  >
                    Pay when your order arrives
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPaymentMethod('razorpay')}
          >
            <View
              style={[
                styles.paymentCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  borderColor:
                    paymentMethod === 'razorpay'
                      ? theme.colors.primary
                      : theme.colors.border,
                  borderWidth: paymentMethod === 'razorpay' ? 2 : 1,
                },
              ]}
            >
              <View style={styles.radioRow}>
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor:
                        paymentMethod === 'razorpay'
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                  ]}
                >
                  {paymentMethod === 'razorpay' && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={
                    paymentMethod === 'razorpay'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                  style={styles.paymentIcon}
                />
                <View style={styles.flex}>
                  <Text
                    style={[
                      styles.paymentLabel,
                      {
                        color: theme.colors.text,
                        fontSize: theme.fontSizes.base,
                      },
                    ]}
                  >
                    Pay Online
                  </Text>
                  <Text
                    style={[
                      styles.paymentHint,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.fontSizes.xs,
                      },
                    ]}
                  >
                    UPI, Cards, Wallets & Net Banking
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 3: Order Summary */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, fontSize: theme.fontSizes.lg },
            ]}
          >
            Order Summary
          </Text>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* Cart items compact list */}
            {cartItems.map((item, index) => (
              <View
                key={`${item.productId}-${item.variant ?? ''}`}
                style={[
                  styles.summaryItem,
                  index < cartItems.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.summaryItemLeft}>
                  <Text
                    style={[
                      styles.summaryItemName,
                      {
                        color: theme.colors.text,
                        fontSize: theme.fontSizes.sm,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.summaryItemQty,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.fontSizes.xs,
                      },
                    ]}
                  >
                    Qty: {item.quantity}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.summaryItemPrice,
                    {
                      color: theme.colors.text,
                      fontSize: theme.fontSizes.sm,
                    },
                  ]}
                >
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}

            {/* Totals */}
            <View
              style={[
                styles.totalsSection,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <View style={styles.totalRow}>
                <Text
                  style={[
                    styles.totalLabel,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSizes.sm,
                    },
                  ]}
                >
                  Subtotal
                </Text>
                <Text
                  style={[
                    styles.totalValue,
                    {
                      color: theme.colors.text,
                      fontSize: theme.fontSizes.sm,
                    },
                  ]}
                >
                  {formatCurrency(subtotal)}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text
                  style={[
                    styles.totalLabel,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSizes.sm,
                    },
                  ]}
                >
                  Shipping
                </Text>
                {shippingCost === 0 ? (
                  <View style={styles.freeShippingRow}>
                    <Text
                      style={[
                        styles.freeShippingText,
                        { color: theme.colors.success, fontSize: theme.fontSizes.sm },
                      ]}
                    >
                      FREE
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.totalValue,
                      {
                        color: theme.colors.text,
                        fontSize: theme.fontSizes.sm,
                      },
                    ]}
                  >
                    {formatCurrency(shippingCost)}
                  </Text>
                )}
              </View>

              {shippingCost > 0 && (
                <Text
                  style={[
                    styles.shippingHint,
                    {
                      color: theme.colors.success,
                      fontSize: theme.fontSizes.xs,
                    },
                  ]}
                >
                  Free shipping on orders above{' '}
                  {formatCurrency(FREE_SHIPPING_THRESHOLD)}
                </Text>
              )}

              {discount > 0 && (
                <View style={styles.totalRow}>
                  <Text
                    style={[
                      styles.totalLabel,
                      {
                        color: theme.colors.success,
                        fontSize: theme.fontSizes.sm,
                      },
                    ]}
                  >
                    Discount{couponCode ? ` (${couponCode})` : ''}
                  </Text>
                  <Text
                    style={[
                      styles.totalValue,
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
                style={[
                  styles.grandTotalRow,
                  { borderTopColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.grandTotalLabel,
                    {
                      color: theme.colors.text,
                      fontSize: theme.fontSizes.lg,
                    },
                  ]}
                >
                  Total
                </Text>
                <Text
                  style={[
                    styles.grandTotalValue,
                    {
                      color: theme.colors.primary,
                      fontSize: theme.fontSizes.xl,
                    },
                  ]}
                >
                  {formatCurrency(total)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Place Order Button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          },
        ]}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isPlacingOrder}
          disabled={isPlacingOrder || cartItems.length === 0}
          onPress={handlePlaceOrder}
        >
          {paymentMethod === 'cod'
            ? `Place Order - ${formatCurrency(total)}`
            : `Pay ${formatCurrency(total)}`}
        </Button>
      </View>

      {/* Add Address Modal */}
      <Modal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        title="Add New Address"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Enter full name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Phone Number"
                placeholder="10-digit mobile number"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                keyboardType="phone-pad"
                maxLength={10}
              />
            )}
          />

          <Controller
            control={control}
            name="addressLine1"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Address Line 1"
                placeholder="House no, Building, Street"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.addressLine1?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="addressLine2"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Address Line 2 (Optional)"
                placeholder="Area, Landmark"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.addressLine2?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="City"
                placeholder="Enter city"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.city?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="state"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="State"
                placeholder="Enter state"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.state?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="pincode"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Pincode"
                placeholder="6-digit pincode"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.pincode?.message}
                keyboardType="number-pad"
                maxLength={6}
              />
            )}
          />

          <View style={styles.modalButtonRow}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={createAddressMutation.isPending}
              onPress={handleSubmit(handleAddAddress)}
            >
              Save Address
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  loader: {
    paddingVertical: 20,
  },
  emptyAddress: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyAddressText: {
    fontWeight: '500',
  },
  addressCard: {
    padding: 14,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  addressDetails: {
    flex: 1,
    gap: 2,
  },
  addressName: {
    fontWeight: '600',
  },
  addressLine: {
    lineHeight: 20,
  },
  addressPhone: {
    marginTop: 2,
    fontWeight: '500',
  },
  paymentCard: {
    padding: 16,
  },
  paymentIcon: {
    marginRight: 4,
  },
  paymentLabel: {
    fontWeight: '600',
  },
  paymentHint: {
    marginTop: 2,
  },
  summaryCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  summaryItemName: {
    fontWeight: '500',
  },
  summaryItemQty: {
    marginTop: 2,
  },
  summaryItemPrice: {
    fontWeight: '600',
  },
  totalsSection: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontWeight: '500',
  },
  totalValue: {
    fontWeight: '600',
  },
  freeShippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeShippingText: {
    fontWeight: '700',
  },
  shippingHint: {
    fontWeight: '500',
    marginTop: -4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontWeight: '700',
  },
  grandTotalValue: {
    fontWeight: '800',
  },
  bottomSpacer: {
    height: 20,
  },
  bottomBar: {
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtonRow: {
    marginTop: 8,
    marginBottom: 16,
  },
});

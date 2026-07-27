import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RazorpayCheckout from 'react-native-razorpay';
import { useTheme } from '../../../theme/ThemeContext';
import { Button, Input } from '../../../components/ui';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { LocationPicker, LocationPickerValue } from '../../../components/shared/LocationPicker';
import { CouponSection } from '../components/CouponSection';
import { useCartStore } from '../../../store/cart.store';
import { useAuthStore } from '../../../store/auth.store';
import { useAddresses, useCreateAddress } from '../../auth/hooks';
import { useCreateOrder } from '../../orders/hooks';
import { useCreateRazorpayOrder, useVerifyPayment } from '../../payments/hooks';
import { formatCurrency } from '../../../utils/helpers';
import { FREE_SHIPPING_THRESHOLD, RAZORPAY_KEY, COLORS } from '../../../config/constants';
import { FONTS } from '../../../config/fonts';
import { IAddress, PaymentMethod, AddressLabel } from '../../../types';
import { RazorpaySuccessResponse } from '../../payments/types';

type CheckoutNavigation = NativeStackNavigationProp<any>;

const STEPS = [
  { key: 'cart', label: 'Cart', icon: 'cart-outline' as const },
  { key: 'address', label: 'Address', icon: 'location-outline' as const },
  { key: 'payment', label: 'Payment', icon: 'card-outline' as const },
];

// Flat COD handling fee — must match the backend (orders route: cod ? 100 : 0).
const COD_SHIPPING_FEE = 100;

interface AddressFormState {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  label: AddressLabel;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}

const EMPTY_ADDRESS_FORM: AddressFormState = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false,
  label: 'home',
};

const ADDRESS_LABELS: {
  value: AddressLabel;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'home', label: 'Home', icon: 'home-outline' },
  { value: 'work', label: 'Work', icon: 'briefcase-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

function StepIndicator({
  currentStep,
  onStepPress,
}: {
  currentStep: number;
  onStepPress: (step: number) => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={stepStyles.container}>
      {STEPS.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isClickable = index < currentStep;

        return (
          <React.Fragment key={step.key}>
            <TouchableOpacity
              style={[
                stepStyles.step,
                isActive && { backgroundColor: theme.colors.primary + '15' },
                isCompleted && { backgroundColor: theme.colors.success + '15' },
              ]}
              onPress={() => isClickable && onStepPress(index)}
              disabled={!isClickable}
              activeOpacity={0.7}
            >
              <View
                style={[
                  stepStyles.iconCircle,
                  {
                    backgroundColor: isActive
                      ? theme.colors.primary
                      : isCompleted
                        ? theme.colors.success
                        : theme.colors.border,
                  },
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={step.icon}
                    size={14}
                    color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                  />
                )}
              </View>
              <Text
                style={[
                  stepStyles.label,
                  {
                    color: isActive
                      ? theme.colors.primary
                      : isCompleted
                        ? theme.colors.success
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {step.label}
              </Text>
            </TouchableOpacity>
            {index < STEPS.length - 1 && (
              <View
                style={[
                  stepStyles.connector,
                  {
                    backgroundColor: isCompleted ? theme.colors.success : theme.colors.border,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  step: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 11,
  },
  connector: {
    height: 2,
    flex: 1,
    borderRadius: 1,
    marginHorizontal: 4,
  },
});

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

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Address form state (used for guest + logged-in add-new-address)
  const [addressForm, setAddressForm] = useState<AddressFormState>(EMPTY_ADDRESS_FORM);
  const [addressErrors, setAddressErrors] = useState<
    Partial<Record<keyof AddressFormState, string>>
  >({});
  // Guest address state (for users not logged in)
  const [guestAddress, setGuestAddress] = useState<IAddress | null>(null);

  // Auto-select default address for logged-in users
  React.useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(defaultAddr._id ?? null);
    }
  }, [addresses, selectedAddressId]);

  // Mirror the backend: prepaid (Razorpay) ships free; COD adds a flat ₹100 fee.
  const shippingCost = useMemo(
    () => (paymentMethod === 'cod' ? COD_SHIPPING_FEE : 0),
    [paymentMethod],
  );
  const total = useMemo(
    () => Math.max(0, subtotal + shippingCost - discount),
    [subtotal, shippingCost, discount],
  );

  const selectedAddress = useMemo(
    () => addresses.find((a) => a._id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  useEffect(() => {
    if (!addressModalVisible) return;
    setAddressForm({
      ...EMPTY_ADDRESS_FORM,
      fullName: user?.name ?? '',
      phone: user?.phone ?? '',
    });
    setAddressErrors({});
  }, [addressModalVisible, user]);

  const setAddressField = <K extends keyof AddressFormState>(k: K, v: AddressFormState[K]) => {
    setAddressForm((f) => ({ ...f, [k]: v }));
    if (addressErrors[k]) setAddressErrors((p) => ({ ...p, [k]: undefined }));
  };

  const onLocationPick = (value: LocationPickerValue) => {
    setAddressForm((f) => ({
      ...f,
      addressLine1: value.addressLine1 || f.addressLine1,
      addressLine2: value.addressLine2 ?? f.addressLine2,
      city: value.city || f.city,
      state: value.state || f.state,
      pincode: value.pincode || f.pincode,
      coordinates: value.coordinates ?? f.coordinates,
      formattedAddress: value.formattedAddress ?? f.formattedAddress,
    }));
  };

  const validateAddressForm = () => {
    const e: Partial<Record<keyof AddressFormState, string>> = {};
    if (addressForm.fullName.trim().length < 2) e.fullName = 'Full name is required';
    if (!/^[6-9]\d{9}$/.test(addressForm.phone)) e.phone = 'Enter a valid 10-digit mobile';
    if (addressForm.addressLine1.trim().length < 5)
      e.addressLine1 = 'Address must be at least 5 characters';
    if (!addressForm.city.trim()) e.city = 'City is required';
    if (!addressForm.state.trim()) e.state = 'State is required';
    if (!/^\d{6}$/.test(addressForm.pincode)) e.pincode = 'Pincode must be 6 digits';
    setAddressErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildAddressPayload = (): Omit<IAddress, '_id'> => ({
    fullName: addressForm.fullName,
    phone: addressForm.phone,
    addressLine1: addressForm.addressLine1,
    addressLine2: addressForm.addressLine2 || undefined,
    city: addressForm.city,
    state: addressForm.state,
    pincode: addressForm.pincode,
    isDefault: addressForm.isDefault,
    label: addressForm.label,
    coordinates: addressForm.coordinates,
    formattedAddress: addressForm.formattedAddress,
  });

  const handleSaveAddress = useCallback(async () => {
    if (!validateAddressForm()) {
      showToast('error', 'Please fix the highlighted fields');
      return;
    }
    const payload = buildAddressPayload();
    if (user) {
      try {
        const res = await createAddressMutation.mutateAsync(payload);
        showToast('success', 'Address added successfully');
        setAddressModalVisible(false);
        const newId = (res.data as IAddress | undefined)?._id ?? null;
        if (newId) setSelectedAddressId(newId);
      } catch {
        showToast('error', 'Failed to add address');
      }
    } else {
      setGuestAddress(payload as IAddress);
      setAddressModalVisible(false);
      showToast('success', 'Address saved');
    }
  }, [addressForm, user, createAddressMutation, showToast]);

  const getActiveAddress = useCallback((): IAddress | null => {
    if (user && selectedAddress) return selectedAddress;
    if (!user && guestAddress) return guestAddress;
    return null;
  }, [user, selectedAddress, guestAddress]);

  const canProceedFromStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 0:
          return cartItems.length > 0;
        case 1:
          return !!getActiveAddress();
        case 2:
          return true;
        default:
          return false;
      }
    },
    [cartItems.length, getActiveAddress],
  );

  const handleNext = useCallback(() => {
    if (!canProceedFromStep(currentStep)) {
      if (currentStep === 0) showToast('error', 'Your cart is empty');
      if (currentStep === 1) showToast('error', 'Please add a shipping address');
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, canProceedFromStep, showToast]);

  const handlePlaceOrder = useCallback(async () => {
    const address = getActiveAddress();
    if (!address) {
      showToast('error', 'Please select a shipping address');
      return;
    }

    if (cartItems.length === 0) {
      showToast('error', 'Your cart is empty');
      return;
    }

    if (!user) {
      showToast('error', 'Please login to place your order.');
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderItems = cartItems.map((item) => ({
        product: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant,
      }));

      const orderRes = await createOrderMutation.mutateAsync({
        items: orderItems,
        shippingAddress: address,
        paymentMethod,
        couponCode: couponCode ?? undefined,
      });

      const order = orderRes.data;
      if (!order) {
        showToast('error', 'Failed to create order');
        return;
      }

      // Cash on Delivery: the server already placed the order (no online payment
      // step). Confirm and go home.
      if (paymentMethod === 'cod') {
        clearCart();
        showToast('success', 'Order placed! Pay cash when it arrives.');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          }),
        );
        return;
      }

      const razorpayRes = await createRazorpayOrderMutation.mutateAsync({
        amount: order.total,
        internalOrderId: order._id,
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

      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
        showToast('error', 'Online payment is not available in Expo Go. Please use a dev build.');
        return;
      }

      const paymentResponse: RazorpaySuccessResponse = await RazorpayCheckout.open(options);

      await verifyPaymentMutation.mutateAsync({
        internalOrderId: order._id,
        razorpayOrderId: razorpayData.razorpayOrderId,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      clearCart();
      showToast('success', 'Payment successful! Order placed.');

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        }),
      );
    } catch (error: any) {
      if (__DEV__) {
        console.warn(
          `[checkout ERROR] ${paymentMethod}\n` +
            `  message: ${error?.message ?? 'n/a'}\n` +
            `  description: ${error?.description ?? 'n/a'}\n` +
            `  code: ${error?.code ?? 'n/a'}\n` +
            `  response: ${
              error?.response?.data ? JSON.stringify(error.response.data).slice(0, 400) : 'n/a'
            }`,
        );
      }
      const message = error?.description ?? error?.message ?? 'Something went wrong';
      showToast('error', message);
    } finally {
      setIsPlacingOrder(false);
    }
  }, [
    getActiveAddress,
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

  // ===================== STEP 1: CART ITEMS =====================
  const renderCartStep = () => (
    <View style={styles.section}>
      <Text
        style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.fontSizes.lg }]}
      >
        Order Items ({cartItems.length})
      </Text>

      {cartItems.map((item, index) => (
        <View
          key={`${item.productId}-${item.variant ?? ''}`}
          style={[
            styles.cartItem,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.md,
            },
          ]}
        >
          <Image
            source={{ uri: item.image }}
            style={[styles.cartItemImage, { borderRadius: theme.borderRadius.sm }]}
          />
          <View style={styles.cartItemInfo}>
            <Text
              style={[
                styles.cartItemName,
                { color: theme.colors.text, fontSize: theme.fontSizes.sm },
              ]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            {item.variant && (
              <Text
                style={[
                  styles.cartItemVariant,
                  { color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs },
                ]}
              >
                {item.variant}
              </Text>
            )}
            <View style={styles.cartItemBottom}>
              <Text style={[styles.cartItemPrice, { color: theme.colors.primary }]}>
                {formatCurrency(item.price)}
              </Text>
              <Text style={[styles.cartItemQty, { color: theme.colors.textSecondary }]}>
                Qty: {item.quantity}
              </Text>
            </View>
          </View>
          <Text style={[styles.cartItemTotal, { color: theme.colors.text }]}>
            {formatCurrency(item.price * item.quantity)}
          </Text>
        </View>
      ))}

      {/* Coupon */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            borderColor: theme.colors.border,
            marginBottom: 16,
          },
        ]}
      >
        <CouponSection orderTotal={subtotal + shippingCost} />
      </View>

      {/* Order Summary */}
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
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>Subtotal</Text>
          <Text style={[styles.totalValue, { color: theme.colors.text }]}>
            {formatCurrency(subtotal)}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>Shipping</Text>
          <Text
            style={[
              styles.totalValue,
              { color: shippingCost === 0 ? theme.colors.success : theme.colors.text },
            ]}
          >
            {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
          </Text>
        </View>

        {shippingCost > 0 && (
          <Text style={[styles.shippingHint, { color: theme.colors.success }]}>
            Free shipping on orders above {formatCurrency(FREE_SHIPPING_THRESHOLD)}
          </Text>
        )}

        {discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.success }]}>
              Discount{couponCode ? ` (${couponCode})` : ''}
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.success }]}>
              -{formatCurrency(discount)}
            </Text>
          </View>
        )}

        <View style={[styles.grandTotalRow, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.grandTotalLabel, { color: theme.colors.text }]}>Total</Text>
          <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
            {formatCurrency(total)}
          </Text>
        </View>
      </View>
    </View>
  );

  // ===================== STEP 2: ADDRESS =====================
  const renderAddressStep = () => (
    <View style={styles.section}>
      <Text
        style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.fontSizes.lg }]}
      >
        Shipping Address
      </Text>

      {!user && (
        <View style={[styles.guestBanner, { backgroundColor: '#FFF8F0', borderColor: '#EBE8D8' }]}>
          <Ionicons name="information-circle-outline" size={20} color="#B59F6B" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.guestBannerTitle, { color: theme.colors.text }]}>
              Checking out as guest
            </Text>
            <Text style={[styles.guestBannerSub, { color: theme.colors.textSecondary }]}>
              You can place your order without an account
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Auth', { screen: 'Login' })}>
            <Text style={[styles.loginLink, { color: theme.colors.primary }]}>Login</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logged-in user: show saved addresses */}
      {user && (
        <>
          {addressesLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
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
              <Ionicons name="location-outline" size={32} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyAddressText, { color: theme.colors.textSecondary }]}>
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
                  <View
                    style={[
                      styles.addressCard,
                      {
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                        borderRadius: theme.borderRadius.md,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <View style={styles.radioRow}>
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: isSelected ? theme.colors.primary : theme.colors.border },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[styles.radioInner, { backgroundColor: theme.colors.primary }]}
                          />
                        )}
                      </View>
                      <View style={styles.addressDetails}>
                        <Text style={[styles.addressName, { color: theme.colors.text }]}>
                          {address.fullName}
                        </Text>
                        <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
                          {address.addressLine1}
                          {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                        </Text>
                        <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
                          {address.city}, {address.state} - {address.pincode}
                        </Text>
                        <Text style={[styles.addressPhone, { color: theme.colors.textSecondary }]}>
                          {address.phone}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </>
      )}

      {/* Guest user: show saved guest address */}
      {!user && guestAddress && (
        <View
          style={[
            styles.addressCard,
            {
              borderColor: theme.colors.primary,
              borderWidth: 2,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <View style={styles.radioRow}>
            <View style={[styles.radioOuter, { borderColor: theme.colors.primary }]}>
              <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />
            </View>
            <View style={styles.addressDetails}>
              <Text style={[styles.addressName, { color: theme.colors.text }]}>
                {guestAddress.fullName}
              </Text>
              <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
                {guestAddress.addressLine1}
                {guestAddress.addressLine2 ? `, ${guestAddress.addressLine2}` : ''}
              </Text>
              <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
                {guestAddress.city}, {guestAddress.state} - {guestAddress.pincode}
              </Text>
              <Text style={[styles.addressPhone, { color: theme.colors.textSecondary }]}>
                {guestAddress.phone}
              </Text>
            </View>
          </View>
        </View>
      )}

      <Button
        variant="outline"
        size="md"
        fullWidth
        onPress={() => setAddressModalVisible(true)}
        leftIcon={<Ionicons name="add" size={18} color={theme.colors.primary} />}
      >
        {!user && guestAddress ? 'Change Address' : 'Add New Address'}
      </Button>
    </View>
  );

  // ===================== STEP 3: PAYMENT =====================
  const renderPaymentStep = () => {
    const address = getActiveAddress();

    return (
      <View style={styles.section}>
        {/* Delivery Summary */}
        {address && (
          <View
            style={[
              styles.deliverySummary,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <View style={styles.deliverySummaryHeader}>
              <Ionicons name="location" size={16} color={theme.colors.primary} />
              <Text style={[styles.deliverySummaryTitle, { color: theme.colors.text }]}>
                Delivering to
              </Text>
            </View>
            <Text style={[styles.deliverySummaryAddress, { color: theme.colors.textSecondary }]}>
              {address.fullName}, {address.addressLine1}, {address.city}, {address.state} -{' '}
              {address.pincode}
            </Text>
          </View>
        )}

        <Text
          style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.fontSizes.lg }]}
        >
          Payment Method
        </Text>

        <TouchableOpacity activeOpacity={0.7} onPress={() => setPaymentMethod('razorpay')}>
          <View
            style={[
              styles.paymentCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                borderColor:
                  paymentMethod === 'razorpay' ? theme.colors.primary : theme.colors.border,
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
                      paymentMethod === 'razorpay' ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                {paymentMethod === 'razorpay' && (
                  <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />
                )}
              </View>
              <Ionicons
                name="card-outline"
                size={24}
                color={
                  paymentMethod === 'razorpay' ? theme.colors.primary : theme.colors.textSecondary
                }
                style={styles.paymentIcon}
              />
              <View style={styles.flex}>
                <Text style={[styles.paymentLabel, { color: theme.colors.text }]}>Pay Online</Text>
                <Text style={[styles.paymentHint, { color: theme.colors.textSecondary }]}>
                  UPI, Cards, Wallets & Net Banking
                </Text>
                {!user && (
                  <Text style={[styles.loginRequired, { color: theme.colors.warning }]}>
                    Login required for online payment
                  </Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => setPaymentMethod('cod')}>
          <View
            style={[
              styles.paymentCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                borderColor: paymentMethod === 'cod' ? theme.colors.primary : theme.colors.border,
                borderWidth: paymentMethod === 'cod' ? 2 : 1,
                marginTop: 10,
              },
            ]}
          >
            <View style={styles.radioRow}>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor:
                      paymentMethod === 'cod' ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                {paymentMethod === 'cod' && (
                  <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />
                )}
              </View>
              <Ionicons
                name="cash-outline"
                size={24}
                color={paymentMethod === 'cod' ? theme.colors.primary : theme.colors.textSecondary}
                style={styles.paymentIcon}
              />
              <View style={styles.flex}>
                <Text style={[styles.paymentLabel, { color: theme.colors.text }]}>
                  Cash on Delivery
                </Text>
                <Text style={[styles.paymentHint, { color: theme.colors.textSecondary }]}>
                  Pay in cash when your order arrives (₹100 handling fee)
                </Text>
                {!user && (
                  <Text style={[styles.loginRequired, { color: theme.colors.warning }]}>
                    Login required to place an order
                  </Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Final Order Summary */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderColor: theme.colors.border,
              marginTop: 8,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 12 }]}>
            Order Summary
          </Text>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
              Items ({cartItems.length})
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.text }]}>
              {formatCurrency(subtotal)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>Shipping</Text>
            <Text
              style={[
                styles.totalValue,
                { color: shippingCost === 0 ? theme.colors.success : theme.colors.text },
              ]}
            >
              {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.success }]}>Discount</Text>
              <Text style={[styles.totalValue, { color: theme.colors.success }]}>
                -{formatCurrency(discount)}
              </Text>
            </View>
          )}
          <View style={[styles.grandTotalRow, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.grandTotalLabel, { color: theme.colors.text }]}>Total</Text>
            <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
              {formatCurrency(total)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderCartStep();
      case 1:
        return renderAddressStep();
      case 2:
        return renderPaymentStep();
      default:
        return null;
    }
  };

  const getBottomButtonText = () => {
    if (currentStep < 2) {
      return 'Continue';
    }
    if (!user) {
      return 'Login to Continue';
    }
    return paymentMethod === 'cod'
      ? `Place Order · ${formatCurrency(total)}`
      : `Pay ${formatCurrency(total)}`;
  };

  const handleBottomPress = () => {
    if (currentStep < 2) {
      handleNext();
    } else {
      handlePlaceOrder();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Step Indicator */}
      <View
        style={[
          styles.stepBarContainer,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
        ]}
      >
        <StepIndicator currentStep={currentStep} onStepPress={setCurrentStep} />
      </View>

      <ScrollView
        style={[styles.flex, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Action Bar */}
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
        <View style={styles.bottomBarRow}>
          {currentStep > 0 && (
            <Button
              variant="outline"
              size="lg"
              onPress={() => setCurrentStep(currentStep - 1)}
              style={{ flex: 0.4, marginRight: 10 }}
            >
              Back
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth={currentStep === 0}
            isLoading={isPlacingOrder}
            disabled={isPlacingOrder || cartItems.length === 0}
            onPress={handleBottomPress}
            style={currentStep > 0 ? { flex: 0.6 } : undefined}
          >
            {getBottomButtonText()}
          </Button>
        </View>
      </View>

      {/* Add Address Modal */}
      <Modal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        title="Add Shipping Address"
      >
        <ScrollView
          style={styles.modalScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.mapSection,
              { backgroundColor: COLORS.cream, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.mapHeader}>
              <Ionicons name="location-outline" size={16} color={COLORS.rose} />
              <Text
                style={[
                  styles.mapHeaderText,
                  { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
                ]}
              >
                Pick delivery address
              </Text>
            </View>
            <LocationPicker
              initialValue={{
                addressLine1: addressForm.addressLine1,
                city: addressForm.city,
                state: addressForm.state,
                pincode: addressForm.pincode,
                coordinates: addressForm.coordinates,
                formattedAddress: addressForm.formattedAddress,
              }}
              onChange={onLocationPick}
            />
          </View>

          <Input
            label="Full Name"
            placeholder="Enter full name"
            value={addressForm.fullName}
            onChangeText={(v) => setAddressField('fullName', v)}
            error={addressErrors.fullName}
            autoCapitalize="words"
          />
          <Input
            label="Phone Number"
            placeholder="10-digit mobile number"
            value={addressForm.phone}
            onChangeText={(v) => setAddressField('phone', v)}
            error={addressErrors.phone}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Input
            label="Address Line 1"
            placeholder="House no, Building, Street"
            value={addressForm.addressLine1}
            onChangeText={(v) => setAddressField('addressLine1', v)}
            error={addressErrors.addressLine1}
          />
          <Input
            label="Address Line 2 (Optional)"
            placeholder="Area, Landmark"
            value={addressForm.addressLine2}
            onChangeText={(v) => setAddressField('addressLine2', v)}
          />
          <View style={styles.modalRow}>
            <View style={styles.modalRowItem}>
              <Input
                label="City"
                placeholder="City"
                value={addressForm.city}
                onChangeText={(v) => setAddressField('city', v)}
                error={addressErrors.city}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.modalRowItem}>
              <Input
                label="State"
                placeholder="State"
                value={addressForm.state}
                onChangeText={(v) => setAddressField('state', v)}
                error={addressErrors.state}
                autoCapitalize="words"
              />
            </View>
          </View>
          <Input
            label="Pincode"
            placeholder="6-digit pincode"
            value={addressForm.pincode}
            onChangeText={(v) => setAddressField('pincode', v)}
            error={addressErrors.pincode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <Text
            style={[styles.chipLabel, { color: theme.colors.text, fontFamily: FONTS.body.medium }]}
          >
            Address Type
          </Text>
          <View style={styles.chipRow}>
            {ADDRESS_LABELS.map((l) => {
              const active = addressForm.label === l.value;
              return (
                <TouchableOpacity
                  key={l.value}
                  onPress={() => setAddressField('label', l.value)}
                  activeOpacity={0.85}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? COLORS.rose : theme.colors.border,
                      backgroundColor: active ? COLORS.roseLight : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name={l.icon}
                    size={14}
                    color={active ? COLORS.rose : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: active ? COLORS.rose : theme.colors.textSecondary,
                        fontFamily: FONTS.body.semiBold,
                      },
                    ]}
                  >
                    {l.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {user && (
            <TouchableOpacity
              onPress={() => setAddressField('isDefault', !addressForm.isDefault)}
              style={styles.checkboxRow}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: addressForm.isDefault ? theme.colors.primary : theme.colors.border,
                    backgroundColor: addressForm.isDefault ? theme.colors.primary : 'transparent',
                  },
                ]}
              >
                {addressForm.isDefault && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text
                style={[
                  styles.checkboxLabel,
                  { color: theme.colors.text, fontSize: theme.fontSizes.sm },
                ]}
              >
                Set as default address
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.modalButtonRow}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={createAddressMutation.isPending}
              onPress={handleSaveAddress}
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
  stepBarContainer: {
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.body.bold,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  loader: {
    paddingVertical: 20,
  },
  // Cart step
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  cartItemImage: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    backgroundColor: '#F3F0EA',
  },
  cartItemInfo: {
    flex: 1,
    gap: 2,
  },
  cartItemName: {
    fontFamily: FONTS.body.medium,
    fontWeight: '500',
  },
  cartItemVariant: {
    fontFamily: FONTS.body.regular,
  },
  cartItemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  cartItemPrice: {
    fontFamily: FONTS.body.semiBold,
    fontWeight: '600',
    fontSize: 14,
  },
  cartItemQty: {
    fontFamily: FONTS.body.regular,
    fontSize: 12,
  },
  cartItemTotal: {
    fontFamily: FONTS.body.bold,
    fontWeight: '700',
    fontSize: 14,
    alignSelf: 'center',
  },
  // Guest banner
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  guestBannerTitle: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  guestBannerSub: {
    fontFamily: FONTS.body.regular,
    fontSize: 12,
    marginTop: 1,
  },
  loginLink: {
    fontFamily: FONTS.body.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  // Address
  emptyAddress: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyAddressText: {
    fontFamily: FONTS.body.medium,
    fontWeight: '500',
    fontSize: 14,
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
    fontFamily: FONTS.body.semiBold,
    fontWeight: '600',
    fontSize: 15,
  },
  addressLine: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  addressPhone: {
    fontFamily: FONTS.body.medium,
    marginTop: 2,
    fontWeight: '500',
    fontSize: 13,
  },
  // Payment
  deliverySummary: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  deliverySummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  deliverySummaryTitle: {
    fontFamily: FONTS.body.semiBold,
    fontWeight: '600',
    fontSize: 14,
  },
  deliverySummaryAddress: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: 22,
  },
  paymentCard: {
    padding: 16,
  },
  paymentIcon: {
    marginRight: 4,
  },
  paymentLabel: {
    fontFamily: FONTS.body.semiBold,
    fontWeight: '600',
    fontSize: 15,
  },
  paymentHint: {
    fontFamily: FONTS.body.regular,
    marginTop: 2,
    fontSize: 12,
  },
  loginRequired: {
    fontFamily: FONTS.body.medium,
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  // Summary
  summaryCard: {
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: FONTS.body.medium,
    fontWeight: '500',
    fontSize: 14,
  },
  totalValue: {
    fontFamily: FONTS.body.semiBold,
    fontWeight: '600',
    fontSize: 14,
  },
  shippingHint: {
    fontFamily: FONTS.body.regular,
    fontWeight: '500',
    fontSize: 12,
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
    fontFamily: FONTS.body.bold,
    fontWeight: '700',
    fontSize: 16,
  },
  grandTotalValue: {
    fontFamily: FONTS.body.bold,
    fontWeight: '800',
    fontSize: 20,
  },
  // Bottom
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
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalButtonRow: {
    marginTop: 8,
    marginBottom: 16,
  },
  modalScroll: { maxHeight: 620 },
  mapSection: {
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapHeaderText: { fontSize: 13, letterSpacing: 0.2 },
  modalRow: { flexDirection: 'row', gap: 12 },
  modalRowItem: { flex: 1 },
  chipLabel: { fontSize: 13, marginBottom: 8, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipText: { fontSize: 12 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: { fontWeight: '500' },
});

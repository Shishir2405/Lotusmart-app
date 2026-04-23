import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal as RNModal,
  Pressable,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';
import { formatCurrency } from '../../../utils/helpers';
import { useAvailableCoupons, useValidateCoupon } from '../../coupons/hooks';
import { ICoupon } from '../../coupons/api';
import { useCartStore, AppliedCoupon } from '../../../store/cart.store';
import { useToast } from '../../../components/ui/Toast';

interface Props {
  orderTotal: number;
}

function buildDiscountLabel(c: ICoupon) {
  if (c.discountType === 'percentage') {
    const cap = c.maxDiscountAmount ? ` up to ${formatCurrency(c.maxDiscountAmount)}` : '';
    return `${c.discountValue}% off${cap}`;
  }
  return `${formatCurrency(c.discountValue)} off`;
}

export function CouponSection({ orderTotal }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const validate = useValidateCoupon();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const applyByCode = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim().toUpperCase();
      if (!trimmed) {
        setError('Enter a coupon code');
        return;
      }
      setError(null);
      try {
        const validated = await validate.mutateAsync({ code: trimmed, orderTotal });
        const toStore: AppliedCoupon = {
          code: validated.code,
          description: validated.description,
          discountType: validated.discountType,
          discountValue: validated.discountValue,
          discount: validated.discount,
        };
        applyCoupon(toStore);
        setCode('');
        setSheetOpen(false);
        showToast('success', `Coupon "${validated.code}" applied`);
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
            ?.message ||
          (err as Error)?.message ||
          'Invalid coupon code';
        setError(message);
      }
    },
    [applyCoupon, orderTotal, showToast, validate],
  );

  const handleRemove = useCallback(() => {
    removeCoupon();
    setError(null);
    showToast('info', 'Coupon removed');
  }, [removeCoupon, showToast]);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Ionicons name="pricetag-outline" size={16} color={COLORS.rose} />
        <Text
          style={[styles.heading, { color: theme.colors.text, fontFamily: FONTS.body.semiBold }]}
        >
          Have a coupon?
        </Text>
      </View>

      {appliedCoupon ? (
        <View
          style={[
            styles.appliedRow,
            { backgroundColor: COLORS.oliveLight, borderColor: COLORS.olive + '40' },
          ]}
        >
          <View style={styles.appliedLeft}>
            <View style={[styles.appliedBadge, { backgroundColor: COLORS.olive }]}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.appliedCode,
                  { color: COLORS.oliveDark, fontFamily: FONTS.body.bold },
                ]}
              >
                {appliedCoupon.code}
              </Text>
              <Text
                style={[
                  styles.appliedDiscount,
                  { color: COLORS.oliveDark, fontFamily: FONTS.body.regular },
                ]}
              >
                -{formatCurrency(appliedCoupon.discount)} applied
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Remove coupon"
          >
            <Ionicons name="close-circle" size={22} color={COLORS.oliveDark} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.inputRow,
              {
                borderColor: error ? COLORS.error : theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <TextInput
              value={code}
              onChangeText={(v) => {
                setCode(v);
                if (error) setError(null);
              }}
              placeholder="Enter code"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              style={[styles.input, { color: theme.colors.text, fontFamily: FONTS.body.medium }]}
              onSubmitEditing={() => applyByCode(code)}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={() => applyByCode(code)}
              disabled={validate.isPending || !code.trim()}
              activeOpacity={0.85}
              style={[
                styles.applyBtn,
                {
                  backgroundColor: COLORS.rose,
                  opacity: validate.isPending || !code.trim() ? 0.5 : 1,
                },
              ]}
            >
              {validate.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.applyText, { fontFamily: FONTS.body.bold }]}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={[styles.errorText, { fontFamily: FONTS.body.regular }]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={() => setSheetOpen(true)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={styles.seeAllRow}
          >
            <Ionicons name="gift-outline" size={14} color={COLORS.rose} />
            <Text
              style={[styles.seeAllText, { color: COLORS.rose, fontFamily: FONTS.body.semiBold }]}
            >
              View available coupons
            </Text>
          </TouchableOpacity>
        </>
      )}

      <AvailableCouponsSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onApply={(c) => applyByCode(c.code)}
        orderTotal={orderTotal}
        isApplying={validate.isPending}
      />
    </View>
  );
}

function AvailableCouponsSheet({
  visible,
  onClose,
  onApply,
  orderTotal,
  isApplying,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (c: ICoupon) => void;
  orderTotal: number;
  isApplying: boolean;
}) {
  const { theme } = useTheme();
  const { data, isLoading } = useAvailableCoupons();
  const coupons = useMemo(() => data?.data ?? [], [data]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={sheetStyles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            sheetStyles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View style={sheetStyles.handle} />
          <View style={sheetStyles.headerRow}>
            <View>
              <Text
                style={[
                  sheetStyles.title,
                  { color: theme.colors.text, fontFamily: FONTS.heading.bold },
                ]}
              >
                Available coupons
              </Text>
              <Text
                style={[
                  sheetStyles.subtitle,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                ]}
              >
                Tap any coupon to apply it to this order
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[sheetStyles.closeBtn, { backgroundColor: theme.colors.border + '55' }]}
            >
              <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={sheetStyles.state}>
              <ActivityIndicator color={COLORS.rose} />
            </View>
          ) : coupons.length === 0 ? (
            <View style={sheetStyles.state}>
              <Ionicons name="pricetag-outline" size={28} color={theme.colors.textSecondary} />
              <Text
                style={[
                  sheetStyles.emptyText,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.medium },
                ]}
              >
                No coupons available right now. Check back later!
              </Text>
            </View>
          ) : (
            <FlatList
              data={coupons}
              keyExtractor={(c) => c.code}
              contentContainerStyle={sheetStyles.list}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => {
                const meets = !item.minOrderValue || orderTotal >= item.minOrderValue;
                return (
                  <TouchableOpacity
                    onPress={() => onApply(item)}
                    disabled={!meets || isApplying}
                    activeOpacity={0.85}
                    style={[
                      sheetStyles.couponCard,
                      {
                        borderColor: meets ? COLORS.rose + '55' : theme.colors.border,
                        backgroundColor: meets ? COLORS.roseLight : theme.colors.surface,
                        opacity: meets ? 1 : 0.6,
                      },
                    ]}
                  >
                    <View style={sheetStyles.couponHead}>
                      <Text
                        style={[
                          sheetStyles.couponCode,
                          { color: COLORS.rose, fontFamily: FONTS.body.bold },
                        ]}
                      >
                        {item.code}
                      </Text>
                      <Text
                        style={[
                          sheetStyles.couponValue,
                          { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
                        ]}
                      >
                        {buildDiscountLabel(item)}
                      </Text>
                    </View>
                    {item.description ? (
                      <Text
                        style={[
                          sheetStyles.couponDesc,
                          { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                        ]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    ) : null}
                    {item.minOrderValue ? (
                      <Text
                        style={[
                          sheetStyles.couponMeta,
                          {
                            color: meets ? COLORS.olive : theme.colors.textSecondary,
                            fontFamily: FONTS.body.medium,
                          },
                        ]}
                      >
                        {meets
                          ? `✓ Minimum ${formatCurrency(item.minOrderValue)} reached`
                          : `Add ${formatCurrency(
                              Math.max(0, item.minOrderValue - orderTotal),
                            )} more to use this`}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </RNModal>
  );
}

export default CouponSection;

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heading: { fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 8 },
  applyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: '#FFFFFF', fontSize: 13, letterSpacing: 0.3 },
  errorText: { color: COLORS.error, fontSize: 12 },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  seeAllText: { fontSize: 13 },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  appliedLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  appliedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedCode: { fontSize: 14 },
  appliedDiscount: { fontSize: 12, marginTop: 1 },
});

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,15,15,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 22,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D3D1',
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 18 },
  subtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 20, paddingBottom: 10 },
  state: { paddingVertical: 32, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  couponCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  couponHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponCode: { fontSize: 14, letterSpacing: 0.5 },
  couponValue: { fontSize: 13 },
  couponDesc: { fontSize: 12 },
  couponMeta: { fontSize: 11, marginTop: 2 },
});

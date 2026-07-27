import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeInRight,
  FadeOutLeft,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useCartStore } from '../../../store/cart.store';
import { formatCurrency } from '../../../utils/helpers';
import { ICartItem } from '../../../types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

interface CartItemProps {
  item: ICartItem;
  index?: number;
}

function CartItemComponent({ item, index = 0 }: CartItemProps) {
  const { theme } = useTheme();
  const { updateQuantity, removeItem } = useCartStore();
  const qtyScale = useSharedValue(1);

  const qtyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: qtyScale.value }],
  }));

  const handleIncrement = useCallback(() => {
    if (item.quantity < item.stock) {
      qtyScale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      updateQuantity(item.productId, item.quantity + 1, item.variant);
    }
  }, [item.productId, item.quantity, item.stock, item.variant, updateQuantity, qtyScale]);

  const handleDecrement = useCallback(() => {
    if (item.quantity > 1) {
      qtyScale.value = withSequence(
        withSpring(0.8, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      updateQuantity(item.productId, item.quantity - 1, item.variant);
    }
  }, [item.productId, item.quantity, item.variant, updateQuantity, qtyScale]);

  const handleRemove = useCallback(() => {
    removeItem(item.productId, item.variant);
  }, [item.productId, item.variant, removeItem]);

  const subtotal = item.price * item.quantity;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60).duration(300)}
      exiting={FadeOutLeft.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.md,
        },
      ]}
    >
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[styles.name, { color: theme.colors.text, fontFamily: FONTS.body.semiBold }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <TouchableOpacity
            onPress={handleRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.removeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        {item.variant && (
          <Text
            style={[
              styles.variant,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
            ]}
          >
            {item.variant}
          </Text>
        )}

        <Text
          style={[
            styles.unitPrice,
            { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
          ]}
        >
          {formatCurrency(item.price)}
          {item.unit ? ` / ${item.unit}` : ''}
        </Text>

        <View style={styles.bottomRow}>
          <View style={[styles.quantityContainer, { borderColor: theme.colors.border }]}>
            <TouchableOpacity
              onPress={handleDecrement}
              style={[styles.quantityButton, item.quantity <= 1 && { opacity: 0.3 }]}
              disabled={item.quantity <= 1}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={16} color={theme.colors.text} />
            </TouchableOpacity>

            <Animated.View
              style={[styles.quantityDisplay, { borderColor: theme.colors.border }, qtyAnimStyle]}
            >
              <Text
                style={[
                  styles.quantityText,
                  { color: theme.colors.text, fontFamily: FONTS.body.bold },
                ]}
              >
                {item.quantity}
              </Text>
            </Animated.View>

            <TouchableOpacity
              onPress={handleIncrement}
              style={[styles.quantityButton, item.quantity >= item.stock && { opacity: 0.3 }]}
              disabled={item.quantity >= item.stock}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={COLORS.rose} />
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.subtotal, { color: theme.colors.text, fontFamily: FONTS.body.bold }]}
          >
            {formatCurrency(subtotal)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export const CartItem = React.memo(CartItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  image: {
    width: 85,
    height: 85,
    borderRadius: 10,
    resizeMode: 'contain',
    backgroundColor: '#F3F0EA',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
    lineHeight: 20,
  },
  removeButton: {
    padding: 4,
  },
  variant: {
    marginTop: 2,
    fontSize: 12,
  },
  unitPrice: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    paddingHorizontal: 10,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  quantityText: {
    fontSize: 14,
  },
  subtotal: {
    fontSize: 16,
  },
});

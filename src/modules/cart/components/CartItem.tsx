import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useCartStore } from '../../../store/cart.store';
import { formatCurrency } from '../../../utils/helpers';
import { ICartItem } from '../../../types';

interface CartItemProps {
  item: ICartItem;
}

function CartItemComponent({ item }: CartItemProps) {
  const { theme } = useTheme();
  const { updateQuantity, removeItem } = useCartStore();

  const handleIncrement = useCallback(() => {
    if (item.quantity < item.stock) {
      updateQuantity(item.productId, item.quantity + 1, item.variant);
    }
  }, [item.productId, item.quantity, item.stock, item.variant, updateQuantity]);

  const handleDecrement = useCallback(() => {
    if (item.quantity > 1) {
      updateQuantity(item.productId, item.quantity - 1, item.variant);
    }
  }, [item.productId, item.quantity, item.variant, updateQuantity]);

  const handleRemove = useCallback(() => {
    removeItem(item.productId, item.variant);
  }, [item.productId, item.variant, removeItem]);

  const subtotal = item.price * item.quantity;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.md,
        },
      ]}
    >
      <Image
        source={{ uri: item.image }}
        style={[styles.image, { borderRadius: theme.borderRadius.sm }]}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.name,
              { color: theme.colors.text, fontSize: theme.fontSizes.sm },
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <TouchableOpacity
            onPress={handleRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.removeButton,
              { backgroundColor: theme.colors.error + '12' },
            ]}
          >
            <Text style={[styles.removeText, { color: theme.colors.error }]}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>

        {item.variant && (
          <Text
            style={[
              styles.variant,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.fontSizes.xs,
              },
            ]}
          >
            {item.variant}
          </Text>
        )}

        <Text
          style={[
            styles.price,
            { color: theme.colors.text, fontSize: theme.fontSizes.sm },
          ]}
        >
          {formatCurrency(item.price)}
          {item.unit ? ` / ${item.unit}` : ''}
        </Text>

        <View style={styles.bottomRow}>
          <View
            style={[
              styles.quantityContainer,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.sm,
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleDecrement}
              style={[
                styles.quantityButton,
                item.quantity <= 1 && { opacity: 0.4 },
              ]}
              disabled={item.quantity <= 1}
            >
              <Text
                style={[styles.quantityButtonText, { color: theme.colors.text }]}
              >
                -
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.quantityDisplay,
                { borderColor: theme.colors.border },
              ]}
            >
              <Text
                style={[
                  styles.quantityText,
                  {
                    color: theme.colors.text,
                    fontSize: theme.fontSizes.sm,
                  },
                ]}
              >
                {item.quantity}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleIncrement}
              style={[
                styles.quantityButton,
                item.quantity >= item.stock && { opacity: 0.4 },
              ]}
              disabled={item.quantity >= item.stock}
            >
              <Text
                style={[
                  styles.quantityButtonText,
                  { color: theme.colors.primary },
                ]}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.subtotal,
              {
                color: theme.colors.text,
                fontSize: theme.fontSizes.base,
              },
            ]}
          >
            {formatCurrency(subtotal)}
          </Text>
        </View>
      </View>
    </View>
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
  },
  image: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
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
    fontWeight: '500',
    marginRight: 8,
    lineHeight: 20,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  variant: {
    marginTop: 2,
    fontWeight: '400',
  },
  price: {
    fontWeight: '500',
    marginTop: 4,
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
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  quantityDisplay: {
    paddingHorizontal: 12,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  quantityText: {
    fontWeight: '600',
  },
  subtotal: {
    fontWeight: '700',
  },
});

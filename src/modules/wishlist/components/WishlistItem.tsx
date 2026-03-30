import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Card } from '../../../components/ui';
import { formatCurrency } from '../../../utils/helpers';
import { IWishlistItem } from '../../../types';

interface WishlistItemProps {
  item: IWishlistItem;
  onAddToCart: (item: IWishlistItem) => void;
  onRemove: (productId: string) => void;
}

function WishlistItemComponent({ item, onAddToCart, onRemove }: WishlistItemProps) {
  const { theme } = useTheme();

  const handleAddToCart = useCallback(() => {
    onAddToCart(item);
  }, [item, onAddToCart]);

  const handleRemove = useCallback(() => {
    onRemove(item.productId);
  }, [item.productId, onRemove]);

  const hasDiscount = !!item.compareAtPrice && item.compareAtPrice > item.price;

  return (
    <View style={styles.wrapper}>
      <Card style={styles.card} elevation={1}>
        {/* Remove Button */}
        <TouchableOpacity
          onPress={handleRemove}
          style={[
            styles.removeButton,
            { backgroundColor: theme.colors.error + '14' },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.removeIcon, { color: theme.colors.error }]}>
            ✕
          </Text>
        </TouchableOpacity>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={[
              styles.image,
              { borderRadius: theme.borderRadius.sm },
            ]}
          />

          {/* Out of Stock Overlay */}
          {!item.isInStock && (
            <View
              style={[
                styles.outOfStockOverlay,
                { borderRadius: theme.borderRadius.sm },
              ]}
            >
              <View
                style={[
                  styles.outOfStockBadge,
                  {
                    backgroundColor: theme.colors.error,
                    borderRadius: theme.borderRadius.sm,
                  },
                ]}
              >
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            </View>
          )}
        </View>

        {/* Product Info */}
        <Text
          style={[
            styles.name,
            {
              color: theme.colors.text,
              fontSize: theme.fontSizes.sm,
            },
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text
            style={[
              styles.price,
              {
                color: theme.colors.text,
                fontSize: theme.fontSizes.base,
              },
            ]}
          >
            {formatCurrency(item.price)}
          </Text>
          {hasDiscount && (
            <Text
              style={[
                styles.comparePrice,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSizes.xs,
                },
              ]}
            >
              {formatCurrency(item.compareAtPrice!)}
            </Text>
          )}
        </View>

        {item.unit && (
          <Text
            style={[
              styles.unit,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.fontSizes.xs,
              },
            ]}
          >
            per {item.unit}
          </Text>
        )}

        {/* Add to Cart Button */}
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={!item.isInStock}
          style={[
            styles.addToCartButton,
            {
              backgroundColor: item.isInStock
                ? theme.colors.primary
                : theme.colors.border,
              borderRadius: theme.borderRadius.sm,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.addToCartText,
              {
                color: item.isInStock ? '#FFFFFF' : theme.colors.textSecondary,
                fontSize: theme.fontSizes.xs,
              },
            ]}
          >
            {item.isInStock ? 'Add to Cart' : 'Unavailable'}
          </Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
}

export const WishlistItem = React.memo(WishlistItemComponent);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 6,
  },
  card: {
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  removeIcon: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginBottom: 8,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    minHeight: 40,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  price: {
    fontWeight: '700',
  },
  comparePrice: {
    fontWeight: '400',
    textDecorationLine: 'line-through',
  },
  unit: {
    fontWeight: '400',
    marginBottom: 8,
  },
  addToCartButton: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addToCartText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

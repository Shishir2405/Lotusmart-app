import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../theme/ThemeContext';
import { Card, Badge } from '../../../components/ui';
import { Button } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { useCartStore } from '../../../store/cart.store';
import { useWishlistStore } from '../../../store/wishlist.store';
import { formatCurrency, getDiscountPercentage, truncateText } from '../../../utils/helpers';
import { IProduct } from '../../../types';
import { ProductStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface ProductCardProps {
  product: IProduct;
  horizontal?: boolean;
}

function RatingStars({ rating, size = 12 }: { rating: number; size?: number }) {
  const { theme } = useTheme();
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(rating);
    const half = !filled && i - 0.5 <= rating;
    stars.push(
      <Text
        key={i}
        style={{
          fontSize: size,
          color: filled || half ? '#F59E0B' : theme.colors.border,
          marginRight: 1,
        }}
      >
        {filled ? '\u2605' : half ? '\u2605' : '\u2606'}
      </Text>,
    );
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>;
}

function ProductCardInner({ product, horizontal = false }: ProductCardProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProductStackParamList>>();
  const { showToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlistItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product._id));

  const discount = getDiscountPercentage(product.price, product.compareAtPrice);
  const isOutOfStock = product.stock === 0;
  const cardWidth = horizontal ? 160 : CARD_WIDTH;

  const handlePress = useCallback(() => {
    navigation.navigate('ProductDetail', { productId: product._id });
  }, [navigation, product._id]);

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) return;
    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity: 1,
      stock: product.stock,
      unit: product.unit,
    });
    showToast('success', `${truncateText(product.name, 20)} added to cart`);
  }, [addItem, isOutOfStock, product, showToast]);

  const handleToggleWishlist = useCallback(() => {
    const added = toggleWishlistItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      unit: product.unit,
      isInStock: product.stock > 0,
    });
    showToast(
      'success',
      added ? 'Added to wishlist' : 'Removed from wishlist',
    );
  }, [toggleWishlistItem, product, showToast]);

  return (
    <Card
      onPress={handlePress}
      elevation={1}
      style={[styles.card, { width: cardWidth }]}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.images[0] }}
          style={[
            styles.image,
            { borderTopLeftRadius: theme.borderRadius.md, borderTopRightRadius: theme.borderRadius.md },
          ]}
          resizeMode="cover"
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <View style={[styles.discountBadge, { backgroundColor: '#E8567F' }]}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}

        {/* Wishlist Heart */}
        <TouchableOpacity
          style={[
            styles.wishlistButton,
            {
              backgroundColor: theme.colors.surface + 'E6',
              borderRadius: theme.borderRadius.full,
            },
          ]}
          onPress={handleToggleWishlist}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={{ fontSize: 16, color: isInWishlist ? '#E8567F' : theme.colors.textSecondary }}>
            {isInWishlist ? '\u2665' : '\u2661'}
          </Text>
        </TouchableOpacity>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={[styles.content, { paddingHorizontal: theme.spacing.sm, paddingBottom: theme.spacing.sm }]}>
        <Text
          style={[styles.name, { color: theme.colors.text, fontSize: theme.fontSizes.sm }]}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        {/* Rating */}
        {product.ratings.count > 0 && (
          <View style={styles.ratingRow}>
            <RatingStars rating={product.ratings.average} />
            <Text style={[styles.ratingCount, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs }]}>
              ({product.ratings.count})
            </Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.colors.text, fontSize: theme.fontSizes.base }]}>
            {formatCurrency(product.price)}
          </Text>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <Text
              style={[
                styles.comparePrice,
                { color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs },
              ]}
            >
              {formatCurrency(product.compareAtPrice)}
            </Text>
          )}
        </View>

        {/* Add to Cart Button */}
        <Button
          size="sm"
          variant={isOutOfStock ? 'outline' : 'primary'}
          fullWidth
          disabled={isOutOfStock}
          onPress={handleAddToCart}
        >
          {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
        </Button>
      </View>
    </Card>
  );
}

export const ProductCard = React.memo(ProductCardInner);

const styles = StyleSheet.create({
  card: {
    padding: 0,
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    paddingTop: 8,
    gap: 4,
  },
  name: {
    fontWeight: '600',
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingCount: {
    marginLeft: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  price: {
    fontWeight: '700',
  },
  comparePrice: {
    textDecorationLine: 'line-through',
  },
});

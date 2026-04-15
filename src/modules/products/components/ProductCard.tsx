import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useToast } from '../../../components/ui/Toast';
import { useCartStore } from '../../../store/cart.store';
import { useWishlistStore } from '../../../store/wishlist.store';
import { formatCurrency, getDiscountPercentage, truncateText } from '../../../utils/helpers';
import { IProduct } from '../../../types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface ProductCardProps {
  product: IProduct;
  horizontal?: boolean;
  index?: number;
}

function RatingStars({ rating, size = 12 }: { rating: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(rating);
    stars.push(
      <Ionicons
        key={i}
        name={filled ? 'star' : 'star-outline'}
        size={size}
        color={filled ? '#F59E0B' : '#D6D3D1'}
        style={{ marginRight: 1 }}
      />,
    );
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>;
}

function ProductCardInner({ product, horizontal = false, index = 0 }: ProductCardProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const { showToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlistItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product._id));

  const discount = getDiscountPercentage(product.price, product.compareAtPrice);
  const isOutOfStock = product.stock === 0;
  const cardWidth = horizontal ? 160 : CARD_WIDTH;

  // Animations
  const cardScale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const cartBtnScale = useSharedValue(1);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const cartBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartBtnScale.value }],
  }));

  const handlePress = useCallback(() => {
    navigation.navigate('ProductDetail', { productId: product._id });
  }, [navigation, product._id]);

  const handlePressIn = useCallback(() => {
    cardScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [cardScale]);

  const handlePressOut = useCallback(() => {
    cardScale.value = withSpring(1, { damping: 10, stiffness: 200 });
  }, [cardScale]);

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) return;
    cartBtnScale.value = withSequence(
      withSpring(0.85, { damping: 15, stiffness: 400 }),
      withSpring(1.05, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
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
  }, [addItem, isOutOfStock, product, showToast, cartBtnScale]);

  const handleToggleWishlist = useCallback(() => {
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 6, stiffness: 400 }),
      withSpring(0.8, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
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
    showToast('success', added ? 'Added to wishlist' : 'Removed from wishlist');
  }, [toggleWishlistItem, product, showToast, heartScale]);

  return (
    <Animated.View
      entering={FadeIn.delay(index * 80).duration(400)}
      style={[cardAnimStyle, { width: cardWidth, marginBottom: 14 }]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
          },
        ]}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images[0] }}
            style={[
              styles.image,
              {
                borderTopLeftRadius: theme.borderRadius.md,
                borderTopRightRadius: theme.borderRadius.md,
              },
            ]}
            resizeMode="cover"
          />

          {/* Discount badge */}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}

          {/* Wishlist */}
          <TouchableOpacity
            style={[styles.wishlistButton, { backgroundColor: theme.colors.surface + 'E6' }]}
            onPress={handleToggleWishlist}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            activeOpacity={0.7}
          >
            <Animated.View style={heartAnimStyle}>
              <Ionicons
                name={isInWishlist ? 'heart' : 'heart-outline'}
                size={18}
                color={isInWishlist ? COLORS.rose : theme.colors.textSecondary}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Out of stock */}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[styles.name, { color: theme.colors.text, fontFamily: FONTS.body.semiBold }]}
            numberOfLines={2}
          >
            {product.name}
          </Text>

          {product.ratings.count > 0 && (
            <View style={styles.ratingRow}>
              <RatingStars rating={product.ratings.average} />
              <Text
                style={[
                  styles.ratingCount,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                ]}
              >
                ({product.ratings.count})
              </Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.colors.text, fontFamily: FONTS.body.bold }]}>
              {formatCurrency(product.price)}
            </Text>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <Text
                style={[
                  styles.comparePrice,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                ]}
              >
                {formatCurrency(product.compareAtPrice)}
              </Text>
            )}
          </View>

          {/* Add to Cart */}
          <Animated.View style={cartBtnAnimStyle}>
            <TouchableOpacity
              style={[
                styles.addToCartBtn,
                {
                  backgroundColor: isOutOfStock ? theme.colors.border : COLORS.rose,
                  borderRadius: theme.borderRadius.sm,
                },
              ]}
              onPress={handleAddToCart}
              disabled={isOutOfStock}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isOutOfStock ? 'close-circle-outline' : 'cart-outline'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.addToCartText}>
                {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export const ProductCard = React.memo(ProductCardInner);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
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
    backgroundColor: COLORS.rose,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.body.bold,
    letterSpacing: 0.3,
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.body.bold,
    letterSpacing: 0.5,
  },
  content: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontSize: 13,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingCount: {
    fontSize: 11,
    marginLeft: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
  },
  comparePrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 5,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.body.semiBold,
  },
});

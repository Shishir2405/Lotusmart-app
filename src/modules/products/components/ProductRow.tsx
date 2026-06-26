import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppImage } from '../../../components/ui/AppImage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useToast } from '../../../components/ui/Toast';
import { useCartStore } from '../../../store/cart.store';
import { useWishlistStore } from '../../../store/wishlist.store';
import { formatCurrency, getDiscountPercentage } from '../../../utils/helpers';
import { IProduct } from '../../../types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

interface Props {
  product: IProduct;
}

export function ProductRow({ product }: Props) {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const { showToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlistItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product._id));

  const discount = getDiscountPercentage(product.price, product.compareAtPrice);
  const isOutOfStock = product.stock === 0;

  const handlePress = useCallback(() => {
    navigation.navigate('ProductDetail', { productId: product._id });
  }, [navigation, product._id]);

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) return;
    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity: 1,
      stock: product.stock,
      unit: product.unit,
    });
    showToast('success', `${product.name} added to cart`);
  }, [addItem, isOutOfStock, product, showToast]);

  const handleWishlist = useCallback(() => {
    toggleWishlistItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      isInStock: !isOutOfStock,
      unit: product.unit,
    });
  }, [toggleWishlistItem, product, isOutOfStock]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.imageWrap}>
        {product.images?.[0] ? (
          <AppImage source={{ uri: product.images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="leaf-outline" size={22} color={COLORS.olive} />
          </View>
        )}
        {discount > 0 ? (
          <View style={[styles.discountPill, { backgroundColor: COLORS.rose }]}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        ) : null}
        {isOutOfStock ? (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>Out of stock</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text
          style={[styles.name, { color: theme.colors.text, fontFamily: FONTS.body.bold }]}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        {product.shortDescription ? (
          <Text
            style={[
              styles.desc,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
            ]}
            numberOfLines={2}
          >
            {product.shortDescription}
          </Text>
        ) : null}

        <View style={styles.meta}>
          {product.ratings?.count ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text
                style={[
                  styles.ratingText,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.semiBold },
                ]}
              >
                {product.ratings.average.toFixed(1)}
              </Text>
              <Text
                style={[
                  styles.ratingCount,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                ]}
              >
                ({product.ratings.count})
              </Text>
            </View>
          ) : null}
          {product.isOrganic ? (
            <View style={[styles.badge, { backgroundColor: COLORS.oliveLight }]}>
              <Text style={[styles.badgeText, { color: COLORS.olive }]}>Organic</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: COLORS.rose, fontFamily: FONTS.heading.bold }]}>
            {formatCurrency(product.price)}
          </Text>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <Text
              style={[
                styles.compare,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              {formatCurrency(product.compareAtPrice)}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleWishlist}
          activeOpacity={0.85}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={[
            styles.iconBtn,
            {
              backgroundColor: isInWishlist ? COLORS.rose : theme.colors.border + '55',
              borderColor: isInWishlist ? COLORS.rose : theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name={isInWishlist ? 'heart' : 'heart-outline'}
            size={14}
            color={isInWishlist ? '#FFFFFF' : theme.colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={isOutOfStock}
          activeOpacity={0.85}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={[
            styles.cartBtn,
            {
              backgroundColor: isOutOfStock ? theme.colors.border : COLORS.rose,
              borderColor: isOutOfStock ? theme.colors.border : COLORS.rose,
            },
          ]}
        >
          <Ionicons
            name="cart-outline"
            size={14}
            color={isOutOfStock ? theme.colors.textSecondary : '#FFFFFF'}
          />
          <Text
            style={[
              styles.cartText,
              {
                color: isOutOfStock ? theme.colors.textSecondary : '#FFFFFF',
                fontFamily: FONTS.body.bold,
              },
            ]}
          >
            Add
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  imageWrap: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F3F0EA',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  discountPill: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: FONTS.body.bold,
    letterSpacing: 0.4,
  },
  outOfStock: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(17, 17, 17, 0.7)',
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: FONTS.body.bold,
    letterSpacing: 0.4,
  },
  body: { flex: 1, justifyContent: 'space-between' },
  name: { fontSize: 14, lineHeight: 19 },
  desc: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11 },
  ratingCount: { fontSize: 10 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 9, fontFamily: FONTS.body.bold, letterSpacing: 0.4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  price: { fontSize: 16 },
  compare: { fontSize: 12, textDecorationLine: 'line-through' },
  actions: { alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  cartText: { fontSize: 11, letterSpacing: 0.3 },
});

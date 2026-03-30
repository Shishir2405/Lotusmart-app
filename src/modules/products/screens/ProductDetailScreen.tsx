import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeContext';
import { Button, Badge } from '../../../components/ui';
import { Skeleton } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { useProduct } from '../hooks';
import { useCartStore } from '../../../store/cart.store';
import { useWishlistStore } from '../../../store/wishlist.store';
import { formatCurrency, getDiscountPercentage } from '../../../utils/helpers';
import { IProductVariantOption } from '../../../types';
import { ProductStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RouteProps = RouteProp<ProductStackParamList, 'ProductDetail'>;

function RatingStars({ rating, size = 16 }: { rating: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Text key={i} style={{ fontSize: size, color: i <= Math.floor(rating) ? '#F59E0B' : '#D1D5DB', marginRight: 2 }}>
        {i <= Math.floor(rating) ? '\u2605' : '\u2606'}
      </Text>,
    );
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>;
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.fontSizes.lg }]}>
          {title}
        </Text>
        <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>
          {expanded ? '\u25B2' : '\u25BC'}
        </Text>
      </TouchableOpacity>
      {expanded && <View style={{ paddingBottom: 16 }}>{children}</View>}
    </View>
  );
}

export function ProductDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const { productId } = route.params;
  const { showToast } = useToast();

  const { data: productRes, isLoading } = useProduct(productId);
  const product = productRes?.data;

  const addCartItem = useCartStore((s) => s.addItem);
  const toggleWishlistItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(productId));

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, IProductVariantOption>>({});
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveImageIndex(index);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    if (product.stock === 0) {
      showToast('error', 'This product is currently out of stock');
      return;
    }

    const variantName = Object.entries(selectedVariants)
      .map(([key, opt]) => `${key}: ${opt.value}`)
      .join(', ') || undefined;

    const priceAdjustment = Object.values(selectedVariants).reduce(
      (sum, opt) => sum + (opt.priceAdjustment || 0),
      0,
    );

    addCartItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] ?? '',
      price: product.price + priceAdjustment,
      compareAtPrice: product.compareAtPrice,
      quantity,
      variant: variantName,
      stock: product.stock,
      unit: product.unit,
    });
    showToast('success', 'Added to cart');
  }, [product, quantity, selectedVariants, addCartItem, showToast]);

  const handleToggleWishlist = useCallback(() => {
    if (!product) return;
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
  }, [product, toggleWishlistItem, showToast]);

  const handleVariantSelect = useCallback((variantName: string, option: IProductVariantOption) => {
    setSelectedVariants((prev) => ({ ...prev, [variantName]: option }));
  }, []);

  const incrementQty = useCallback(() => {
    if (!product) return;
    const max = product.maxOrderQuantity ?? product.stock;
    setQuantity((q) => Math.min(q + 1, max));
  }, [product]);

  const decrementQty = useCallback(() => {
    const min = product?.minOrderQuantity ?? 1;
    setQuantity((q) => Math.max(q - 1, min));
  }, [product]);

  if (isLoading || !product) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Skeleton width={SCREEN_WIDTH} height={SCREEN_WIDTH * 0.85} borderRadius={0} />
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton width="80%" height={24} />
          <Skeleton width="50%" height={16} />
          <Skeleton width="40%" height={28} />
          <Skeleton width="100%" height={48} borderRadius={theme.borderRadius.md} style={{ marginTop: 12 }} />
          <Skeleton width="100%" height={48} borderRadius={theme.borderRadius.md} />
          <Skeleton width="100%" height={80} style={{ marginTop: 16 }} />
        </View>
      </ScrollView>
    );
  }

  const discount = getDiscountPercentage(product.price, product.compareAtPrice);
  const isOutOfStock = product.stock === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {product.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {/* Dots Indicator */}
          {product.images.length > 1 && (
            <View style={styles.dotsContainer}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === activeImageIndex
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={[styles.infoContainer, { padding: theme.spacing.lg }]}>
          {/* Brand */}
          {product.brand && (
            <Text style={[styles.brand, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }]}>
              {product.brand}
            </Text>
          )}

          {/* Name */}
          <Text style={[styles.productName, { color: theme.colors.text, fontSize: theme.fontSizes['2xl'] }]}>
            {product.name}
          </Text>

          {/* Rating */}
          {product.ratings.count > 0 && (
            <View style={styles.ratingRow}>
              <RatingStars rating={product.ratings.average} />
              <Text style={[styles.ratingText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }]}>
                {product.ratings.average.toFixed(1)} ({product.ratings.count} reviews)
              </Text>
            </View>
          )}

          {/* Badges */}
          <View style={styles.badgeRow}>
            {product.isOrganic && <Badge text="Organic" variant="success" />}
            {product.isVegan && <Badge text="Vegan" variant="primary" />}
            {product.isGlutenFree && <Badge text="Gluten Free" variant="info" />}
            {product.certifications?.map((cert) => (
              <Badge key={cert} text={cert} variant="outline" />
            ))}
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: theme.colors.text, fontSize: theme.fontSizes['3xl'] }]}>
              {formatCurrency(product.price)}
            </Text>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <>
                <Text style={[styles.comparePrice, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.lg }]}>
                  {formatCurrency(product.compareAtPrice)}
                </Text>
                <View style={[styles.discountBadge, { borderRadius: theme.borderRadius.sm }]}>
                  <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
              </>
            )}
          </View>

          {/* Stock Status */}
          <Text
            style={{
              fontSize: theme.fontSizes.sm,
              fontWeight: '600',
              color: isOutOfStock ? theme.colors.error : theme.colors.success,
              marginBottom: 16,
            }}
          >
            {isOutOfStock ? 'Out of Stock' : product.stock <= 10 ? `Only ${product.stock} left` : 'In Stock'}
          </Text>

          {/* Variant Selectors */}
          {product.variants.length > 0 &&
            product.variants.map((variant) => (
              <View key={variant.name} style={styles.variantSection}>
                <Text style={[styles.variantLabel, { color: theme.colors.text, fontSize: theme.fontSizes.base }]}>
                  {variant.name}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.variantOptions}>
                    {variant.options.map((option) => {
                      const isSelected = selectedVariants[variant.name]?.value === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.variantPill,
                            {
                              borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                              backgroundColor: isSelected ? theme.colors.primary + '14' : 'transparent',
                              borderRadius: theme.borderRadius.full,
                            },
                          ]}
                          onPress={() => handleVariantSelect(variant.name, option)}
                        >
                          <Text
                            style={{
                              fontSize: theme.fontSizes.sm,
                              fontWeight: '600',
                              color: isSelected ? theme.colors.primary : theme.colors.text,
                            }}
                          >
                            {option.value}
                          </Text>
                          {option.priceAdjustment !== 0 && (
                            <Text
                              style={{
                                fontSize: theme.fontSizes.xs,
                                color: theme.colors.textSecondary,
                                marginLeft: 4,
                              }}
                            >
                              {option.priceAdjustment > 0 ? '+' : ''}
                              {formatCurrency(option.priceAdjustment)}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ))}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={[styles.variantLabel, { color: theme.colors.text, fontSize: theme.fontSizes.base }]}>
              Quantity
            </Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                onPress={decrementQty}
              >
                <Text style={[styles.quantityButtonText, { color: theme.colors.text }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.quantityValue, { color: theme.colors.text, fontSize: theme.fontSizes.lg }]}>
                {quantity}
              </Text>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                onPress={incrementQty}
              >
                <Text style={[styles.quantityButtonText, { color: theme.colors.text }]}>+</Text>
              </TouchableOpacity>
              {product.unit && (
                <Text style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, marginLeft: 8 }}>
                  per {product.unit}
                </Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={isOutOfStock}
              onPress={handleAddToCart}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <View style={{ height: 10 }} />
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onPress={handleToggleWishlist}
            >
              {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </Button>
          </View>

          {/* Bulk Pricing */}
          {product.bulkPricing && product.bulkPricing.length > 0 && (
            <View style={[styles.bulkSection, { backgroundColor: theme.colors.accent + '14', borderRadius: theme.borderRadius.md }]}>
              <Text style={[styles.bulkTitle, { color: theme.colors.text, fontSize: theme.fontSizes.base }]}>
                Bulk Pricing
              </Text>
              {product.bulkPricing.map((bp, idx) => (
                <View key={idx} style={styles.bulkRow}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>
                    {bp.minQty}-{bp.maxQty} {bp.unit}
                  </Text>
                  <Text style={{ color: theme.colors.text, fontSize: theme.fontSizes.sm, fontWeight: '600' }}>
                    {formatCurrency(bp.price)} / {bp.unit}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Description */}
        <CollapsibleSection title="Description" defaultOpen>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.fontSizes.sm,
              lineHeight: 22,
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            {product.description}
          </Text>
        </CollapsibleSection>

        {/* Nutrition Info */}
        {product.nutritionInfo && (
          <CollapsibleSection title="Nutrition Information">
            <View style={{ paddingHorizontal: theme.spacing.lg, gap: 6 }}>
              {product.nutritionInfo.servingSize && (
                <NutritionRow label="Serving Size" value={product.nutritionInfo.servingSize} />
              )}
              {product.nutritionInfo.calories != null && (
                <NutritionRow label="Calories" value={`${product.nutritionInfo.calories} kcal`} />
              )}
              {product.nutritionInfo.protein != null && (
                <NutritionRow label="Protein" value={`${product.nutritionInfo.protein}g`} />
              )}
              {product.nutritionInfo.totalFat != null && (
                <NutritionRow label="Total Fat" value={`${product.nutritionInfo.totalFat}g`} />
              )}
              {product.nutritionInfo.totalCarbohydrates != null && (
                <NutritionRow label="Total Carbs" value={`${product.nutritionInfo.totalCarbohydrates}g`} />
              )}
              {product.nutritionInfo.dietaryFiber != null && (
                <NutritionRow label="Dietary Fiber" value={`${product.nutritionInfo.dietaryFiber}g`} />
              )}
              {product.nutritionInfo.sugars != null && (
                <NutritionRow label="Sugars" value={`${product.nutritionInfo.sugars}g`} />
              )}
              {product.nutritionInfo.sodium != null && (
                <NutritionRow label="Sodium" value={`${product.nutritionInfo.sodium}mg`} />
              )}
            </View>
          </CollapsibleSection>
        )}

        {/* Specifications */}
        <CollapsibleSection title="Specifications">
          <View style={{ paddingHorizontal: theme.spacing.lg, gap: 6 }}>
            <NutritionRow label="SKU" value={product.sku} />
            {product.productType && <NutritionRow label="Type" value={product.productType} />}
            {product.unit && <NutritionRow label="Unit" value={product.unit} />}
            {product.tags && product.tags.length > 0 && (
              <NutritionRow label="Tags" value={product.tags.join(', ')} />
            )}
          </View>
        </CollapsibleSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function NutritionRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.nutritionRow}>
      <Text style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSizes.sm, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoContainer: {
    gap: 4,
  },
  brand: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  productName: {
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingText: {
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  price: {
    fontWeight: '800',
  },
  comparePrice: {
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#E84672',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  variantSection: {
    marginBottom: 16,
  },
  variantLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  variantOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  variantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  quantityValue: {
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'center',
  },
  actionButtons: {
    marginBottom: 20,
  },
  bulkSection: {
    padding: 16,
    marginBottom: 8,
  },
  bulkTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  section: {
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});

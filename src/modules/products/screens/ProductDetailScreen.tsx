import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { AppImage } from '../../../components/ui/AppImage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import { Badge, Skeleton } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { useProduct } from '../hooks';
import { useLoadingCap } from '../../../hooks/useLoadingCap';
import { useCartStore } from '../../../store/cart.store';
import { useWishlistStore } from '../../../store/wishlist.store';
import { formatCurrency, getDiscountPercentage } from '../../../utils/helpers';
import { IProductVariantOption } from '../../../types';
import { ProductStackParamList } from '../types';
import RenderHtml from 'react-native-render-html';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RouteProps = RouteProp<ProductStackParamList, 'ProductDetail'>;

// ====== COLLAPSIBLE SECTION ======
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
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text, fontFamily: FONTS.heading.semiBold },
          ]}
        >
          {title}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
      {expanded && <View style={{ paddingBottom: 16 }}>{children}</View>}
    </View>
  );
}

// ====== NUTRITION ROW ======
function NutritionRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.nutritionRow}>
      <Text
        style={{ color: theme.colors.textSecondary, fontSize: 14, fontFamily: FONTS.body.regular }}
      >
        {label}
      </Text>
      <Text style={{ color: theme.colors.text, fontSize: 14, fontFamily: FONTS.body.medium }}>
        {value}
      </Text>
    </View>
  );
}

// ====== MAIN SCREEN ======
export function ProductDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const insets = useSafeAreaInsets();
  const { productId } = route.params;
  const { showToast } = useToast();

  const { data: productRes, isLoading } = useProduct(productId);
  const product = productRes?.data;
  const showSkeleton = useLoadingCap(isLoading && !product);

  const addCartItem = useCartStore((s) => s.addItem);
  const toggleWishlistItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(productId));

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, IProductVariantOption>>(
    {},
  );
  const imageListRef = useRef<FlatList>(null);

  // Animations
  const heartScale = useSharedValue(1);
  const cartBtnScale = useSharedValue(1);
  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const cartBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartBtnScale.value }],
  }));

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveImageIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    if (product.stock === 0) {
      showToast('error', 'This product is currently out of stock');
      return;
    }

    cartBtnScale.value = withSequence(
      withSpring(0.9, { damping: 15, stiffness: 400 }),
      withSpring(1.05, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );

    const variantName =
      Object.entries(selectedVariants)
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
  }, [product, quantity, selectedVariants, addCartItem, showToast, cartBtnScale]);

  const handleBuyNow = useCallback(() => {
    if (!product || product.stock === 0) return;

    const variantName =
      Object.entries(selectedVariants)
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
    navigation.navigate('Checkout');
  }, [product, quantity, selectedVariants, addCartItem, navigation]);

  const handleToggleWishlist = useCallback(() => {
    if (!product) return;
    heartScale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 400 }),
      withSpring(0.85, { damping: 8, stiffness: 300 }),
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
  }, [product, toggleWishlistItem, showToast, heartScale]);

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

  // ====== LOADING STATE ======
  if (!product) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {showSkeleton ? (
          <>
            <Skeleton width={SCREEN_WIDTH} height={SCREEN_WIDTH * 0.85} borderRadius={0} />
            <View style={{ padding: 16, gap: 12 }}>
              <Skeleton width="80%" height={24} />
              <Skeleton width="50%" height={16} />
              <Skeleton width="40%" height={28} />
              <Skeleton
                width="100%"
                height={48}
                borderRadius={theme.borderRadius.md}
                style={{ marginTop: 12 }}
              />
              <Skeleton width="100%" height={48} borderRadius={theme.borderRadius.md} />
            </View>
          </>
        ) : null}
      </ScrollView>
    );
  }

  const discount = getDiscountPercentage(product.price, product.compareAtPrice);
  const isOutOfStock = product.stock === 0;
  const selectedVariantPriceAdjustment = Object.values(selectedVariants).reduce(
    (sum, opt) => sum + (opt.priceAdjustment || 0),
    0,
  );
  const totalPrice = (product.price + selectedVariantPriceAdjustment) * quantity;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + (insets.bottom > 0 ? insets.bottom : 8) }}
      >
        {/* ====== IMAGE CAROUSEL ====== */}
        <View style={styles.imageSection}>
          <FlatList
            ref={imageListRef}
            data={product.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            keyExtractor={(_, i) => `img-${i}`}
            renderItem={({ item: uri }) => (
              <AppImage
                source={{ uri }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85 }}
              />
            )}
          />

          {/* Wishlist floating button */}
          <TouchableOpacity
            style={[styles.wishlistFloating, { backgroundColor: theme.colors.surface }]}
            onPress={handleToggleWishlist}
            activeOpacity={0.7}
          >
            <Animated.View style={heartAnimStyle}>
              <Ionicons
                name={isInWishlist ? 'heart' : 'heart-outline'}
                size={22}
                color={isInWishlist ? COLORS.rose : theme.colors.textSecondary}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity
            style={[styles.shareFloating, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* Image indicators */}
          {product.images.length > 1 && (
            <View style={styles.dotsContainer}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === activeImageIndex ? COLORS.rose : 'rgba(255,255,255,0.6)',
                      width: index === activeImageIndex ? 20 : 8,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Discount overlay */}
          {discount > 0 && (
            <View style={styles.discountOverlay}>
              <Text style={styles.discountOverlayText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* ====== PRODUCT INFO ====== */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.infoContainer}>
          {/* Brand */}
          {product.brand && (
            <Text style={[styles.brand, { color: COLORS.olive, fontFamily: FONTS.body.semiBold }]}>
              {product.brand}
            </Text>
          )}

          {/* Name */}
          <Text
            style={[
              styles.productName,
              { color: theme.colors.text, fontFamily: FONTS.heading.bold },
            ]}
          >
            {product.name}
          </Text>

          {/* Rating */}
          {product.ratings.count > 0 && (
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFFFFF" />
                <Text style={styles.ratingBadgeText}>{product.ratings.average.toFixed(1)}</Text>
              </View>
              <Text
                style={[
                  styles.ratingText,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                ]}
              >
                ({product.ratings.count} reviews)
              </Text>
            </View>
          )}

          {/* Badges */}
          {(product.isOrganic ||
            product.isVegan ||
            product.isGlutenFree ||
            (product.certifications && product.certifications.length > 0)) && (
            <View style={styles.badgeRow}>
              {product.isOrganic && <Badge text="Organic" variant="success" />}
              {product.isVegan && <Badge text="Vegan" variant="primary" />}
              {product.isGlutenFree && <Badge text="Gluten Free" variant="info" />}
              {product.certifications?.map((cert) => (
                <Badge key={cert} text={cert} variant="outline" />
              ))}
            </View>
          )}

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text
              style={[styles.price, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
            >
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

          {/* Stock */}
          <View
            style={[
              styles.stockRow,
              { backgroundColor: isOutOfStock ? '#FEF2F2' : '#ECFDF5', borderRadius: 8 },
            ]}
          >
            <Ionicons
              name={isOutOfStock ? 'close-circle' : 'checkmark-circle'}
              size={16}
              color={isOutOfStock ? COLORS.error : COLORS.success}
            />
            <Text
              style={{
                fontSize: 13,
                fontFamily: FONTS.body.semiBold,
                color: isOutOfStock ? COLORS.error : COLORS.success,
                marginLeft: 6,
              }}
            >
              {isOutOfStock
                ? 'Out of Stock'
                : product.stock <= 10
                  ? `Only ${product.stock} left!`
                  : 'In Stock'}
            </Text>
          </View>

          {/* Variant Selectors */}
          {product.variants.length > 0 &&
            product.variants.map((variant) => (
              <View key={variant.name} style={styles.variantSection}>
                <Text
                  style={[
                    styles.variantLabel,
                    { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
                  ]}
                >
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
                              borderColor: isSelected ? COLORS.rose : theme.colors.border,
                              backgroundColor: isSelected ? COLORS.rose + '14' : 'transparent',
                            },
                          ]}
                          onPress={() => handleVariantSelect(variant.name, option)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: FONTS.body.semiBold,
                              color: isSelected ? COLORS.rose : theme.colors.text,
                            }}
                          >
                            {option.value}
                          </Text>
                          {option.priceAdjustment !== 0 && (
                            <Text
                              style={{
                                fontSize: 11,
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

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Text
              style={[
                styles.variantLabel,
                { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
              ]}
            >
              Quantity
            </Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                ]}
                onPress={decrementQty}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color={theme.colors.text} />
              </TouchableOpacity>
              <Text
                style={[
                  styles.quantityValue,
                  { color: theme.colors.text, fontFamily: FONTS.body.bold },
                ]}
              >
                {quantity}
              </Text>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                ]}
                onPress={incrementQty}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={theme.colors.text} />
              </TouchableOpacity>
              {product.unit && (
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 13,
                    fontFamily: FONTS.body.regular,
                    marginLeft: 10,
                  }}
                >
                  per {product.unit}
                </Text>
              )}
            </View>
          </View>

          {/* Bulk Pricing */}
          {product.bulkPricing && product.bulkPricing.length > 0 && (
            <View style={[styles.bulkSection, { backgroundColor: COLORS.goldLight }]}>
              <View style={styles.bulkHeader}>
                <Ionicons name="pricetags" size={16} color={COLORS.goldDark} />
                <Text
                  style={[
                    styles.bulkTitle,
                    { color: COLORS.goldDark, fontFamily: FONTS.body.bold },
                  ]}
                >
                  Bulk Pricing
                </Text>
              </View>
              {product.bulkPricing.map((bp, idx) => (
                <View key={idx} style={styles.bulkRow}>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: 13,
                      fontFamily: FONTS.body.regular,
                    }}
                  >
                    {bp.minQty}-{bp.maxQty} {bp.unit}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: 13,
                      fontFamily: FONTS.body.semiBold,
                    }}
                  >
                    {formatCurrency(bp.price)} / {bp.unit}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Delivery info strip */}
          <View style={[styles.deliveryStrip, { borderColor: theme.colors.border }]}>
            <View style={styles.deliveryItem}>
              <Ionicons name="car-outline" size={18} color={COLORS.olive} />
              <Text style={[styles.deliveryText, { fontFamily: FONTS.body.medium }]}>
                Free Delivery
              </Text>
            </View>
            <View style={styles.deliveryDivider} />
            <View style={styles.deliveryItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.olive} />
              <Text style={[styles.deliveryText, { fontFamily: FONTS.body.medium }]}>
                Quality Assured
              </Text>
            </View>
            <View style={styles.deliveryDivider} />
            <View style={styles.deliveryItem}>
              <Ionicons name="refresh-outline" size={18} color={COLORS.olive} />
              <Text style={[styles.deliveryText, { fontFamily: FONTS.body.medium }]}>
                Easy Returns
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Description */}
        <CollapsibleSection title="Description" defaultOpen>
          <View style={{ paddingHorizontal: 16 }}>
            <RenderHtml
              contentWidth={SCREEN_WIDTH - 32}
              source={{ html: product.description || '' }}
              baseStyle={{
                color: theme.colors.textSecondary,
                fontSize: 14,
                lineHeight: 22,
                fontFamily: FONTS.body.regular,
              }}
              tagsStyles={{
                p: { marginVertical: 4 },
                strong: { color: theme.colors.text, fontFamily: FONTS.body.bold },
                b: { color: theme.colors.text, fontFamily: FONTS.body.bold },
                u: { textDecorationLine: 'underline' },
                li: { marginVertical: 2 },
              }}
            />
          </View>
        </CollapsibleSection>

        {/* Nutrition Info */}
        {product.nutritionInfo && (
          <CollapsibleSection title="Nutrition Information">
            <View style={{ paddingHorizontal: 16, gap: 6 }}>
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
                <NutritionRow
                  label="Total Carbs"
                  value={`${product.nutritionInfo.totalCarbohydrates}g`}
                />
              )}
              {product.nutritionInfo.dietaryFiber != null && (
                <NutritionRow
                  label="Dietary Fiber"
                  value={`${product.nutritionInfo.dietaryFiber}g`}
                />
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
          <View style={{ paddingHorizontal: 16, gap: 6 }}>
            <NutritionRow label="SKU" value={product.sku} />
            {product.productType && <NutritionRow label="Type" value={product.productType} />}
            {product.unit && <NutritionRow label="Unit" value={product.unit} />}
            {product.tags && product.tags.length > 0 && (
              <NutritionRow label="Tags" value={product.tags.join(', ')} />
            )}
          </View>
        </CollapsibleSection>
      </ScrollView>

      {/* ====== STICKY BOTTOM ACTION BAR ====== */}
      <Animated.View
        entering={FadeIn.delay(400).duration(300)}
        style={[
          styles.stickyBar,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.stickyPriceCol}>
          <Text
            style={{
              fontSize: 11,
              color: theme.colors.textSecondary,
              fontFamily: FONTS.body.regular,
            }}
          >
            Total Price
          </Text>
          <Text style={{ fontSize: 20, color: theme.colors.text, fontFamily: FONTS.heading.bold }}>
            {formatCurrency(totalPrice)}
          </Text>
        </View>
        <View style={styles.stickyActions}>
          <Animated.View style={[cartBtnAnimStyle, { flex: 1 }]}>
            <TouchableOpacity
              style={[styles.stickyCartBtn, { borderColor: COLORS.rose }]}
              onPress={handleAddToCart}
              disabled={isOutOfStock}
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={20} color={COLORS.rose} />
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity
            style={[styles.stickyBuyBtn, { opacity: isOutOfStock ? 0.5 : 1 }]}
            onPress={handleBuyNow}
            disabled={isOutOfStock}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.rose, COLORS.roseDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.stickyBuyGradient}
            >
              <Text style={styles.stickyBuyText}>{isOutOfStock ? 'Out of Stock' : 'Buy Now'}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageSection: { position: 'relative' },
  wishlistFloating: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  shareFloating: {
    position: 'absolute',
    top: 12,
    right: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    gap: 6,
  },
  dot: { height: 4, borderRadius: 2 },
  discountOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.rose,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.body.bold,
  },
  infoContainer: { padding: 16, gap: 8 },
  brand: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  productName: { fontSize: 22, lineHeight: 28 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingBadgeText: { color: '#FFFFFF', fontSize: 12, fontFamily: FONTS.body.bold },
  ratingText: { fontSize: 13 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 },
  price: { fontSize: 28 },
  comparePrice: { fontSize: 16, textDecorationLine: 'line-through' },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  variantSection: { marginTop: 12 },
  variantLabel: { fontSize: 15, marginBottom: 8 },
  variantOptions: { flexDirection: 'row', gap: 8 },
  variantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderRadius: 9999,
  },
  quantitySection: { marginTop: 12 },
  quantityRow: { flexDirection: 'row', alignItems: 'center' },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
  },
  quantityValue: { fontSize: 18, minWidth: 48, textAlign: 'center' },
  bulkSection: { padding: 14, borderRadius: 12, marginTop: 12 },
  bulkHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  bulkTitle: { fontSize: 14 },
  bulkRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  deliveryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
  },
  deliveryItem: { alignItems: 'center', gap: 4 },
  deliveryText: { fontSize: 11, color: COLORS.textSecondary },
  deliveryDivider: { width: 1, height: 28, backgroundColor: '#E5E7EB' },
  section: { borderTopWidth: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: { fontSize: 17 },
  nutritionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  // Sticky bottom bar
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  stickyPriceCol: { minWidth: 94 },
  stickyActions: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  stickyCartBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyBuyBtn: { flex: 2, borderRadius: 10, overflow: 'hidden' },
  stickyBuyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    gap: 6,
  },
  stickyBuyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.body.bold,
  },
});

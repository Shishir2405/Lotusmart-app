import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { useWishlistStore } from '../../../store/wishlist.store';
import { useCartStore } from '../../../store/cart.store';
import { WishlistItem } from '../components/WishlistItem';
import { IWishlistItem } from '../../../types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

export default function WishlistScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { items, removeItem } = useWishlistStore();
  const addToCart = useCartStore((state) => state.addItem);

  const handleAddToCart = useCallback(
    (item: IWishlistItem) => {
      addToCart({
        productId: item.productId,
        name: item.name,
        slug: item.slug,
        image: item.image,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        quantity: 1,
        stock: item.isInStock ? 999 : 0,
        unit: item.unit,
      });
      showToast('success', `${item.name} added to cart`);
    },
    [addToCart, showToast],
  );

  const handleRemove = useCallback(
    (productId: string) => {
      removeItem(productId);
      showToast('info', 'Removed from wishlist');
    },
    [removeItem, showToast],
  );

  const handleExplore = useCallback(() => {
    (navigation as ReturnType<typeof useNavigation>).navigate(
      'Main' as never,
      { screen: 'HomeTab' } as never,
    );
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: IWishlistItem }) => (
      <WishlistItem item={item} onAddToCart={handleAddToCart} onRemove={handleRemove} />
    ),
    [handleAddToCart, handleRemove],
  );

  const keyExtractor = useCallback((item: IWishlistItem) => item.productId, []);

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.text, fontFamily: FONTS.heading.bold },
            ]}
          >
            My Wishlist
          </Text>
        </View>

        <View style={styles.emptyContainer}>
          <Animated.View
            entering={FadeIn.duration(500)}
            style={[styles.emptyIconContainer, { backgroundColor: COLORS.roseLight }]}
          >
            <Ionicons name="heart-outline" size={48} color={COLORS.rose} />
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.delay(200).duration(400)}
            style={[
              styles.emptyTitle,
              { color: theme.colors.text, fontFamily: FONTS.heading.bold },
            ]}
          >
            Your wishlist is empty
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(300).duration(400)}
            style={[
              styles.emptySubtitle,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
            ]}
          >
            Save items you love to your wishlist and revisit them anytime
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Button size="lg" onPress={handleExplore}>
              Explore Products
            </Button>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.header}>
        <Text
          style={[styles.headerTitle, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
        >
          My Wishlist
        </Text>
        <View style={[styles.countBadge, { backgroundColor: COLORS.rose + '18' }]}>
          <Ionicons name="heart" size={12} color={COLORS.rose} />
          <Text style={[styles.countText, { color: COLORS.rose, fontFamily: FONTS.body.semiBold }]}>
            {items.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  headerTitle: { fontSize: 24 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    gap: 4,
  },
  countText: { fontSize: 12 },
  listContent: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 32 },
  columnWrapper: { justifyContent: 'space-between' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
});

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
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
    (navigation as any).navigate('Products', { screen: 'Home' });
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: IWishlistItem }) => (
      <WishlistItem
        item={item}
        onAddToCart={handleAddToCart}
        onRemove={handleRemove}
      />
    ),
    [handleAddToCart, handleRemove],
  );

  const keyExtractor = useCallback(
    (item: IWishlistItem) => item.productId,
    [],
  );

  if (items.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.text, fontSize: theme.fontSizes['2xl'] },
            ]}
          >
            My Wishlist
          </Text>
        </View>

        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconContainer,
              { backgroundColor: theme.colors.primary + '14' },
            ]}
          >
            <Ionicons
              name="heart-outline"
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <Text
            style={[
              styles.emptyTitle,
              { color: theme.colors.text, fontSize: theme.fontSizes['2xl'] },
            ]}
          >
            Your wishlist is empty
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.fontSizes.sm,
              },
            ]}
          >
            Save items you love to your wishlist and revisit them anytime
          </Text>
          <Button size="lg" onPress={handleExplore}>
            Explore Products
          </Button>
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
          style={[
            styles.headerTitle,
            { color: theme.colors.text, fontSize: theme.fontSizes['2xl'] },
          ]}
        >
          My Wishlist
        </Text>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: theme.colors.primary + '18' },
          ]}
        >
          <Text
            style={[
              styles.countText,
              {
                color: theme.colors.primary,
                fontSize: theme.fontSizes.xs,
              },
            ]}
          >
            {items.length} {items.length === 1 ? 'item' : 'items'}
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
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  headerTitle: {
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  countText: {
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
});

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../theme/ThemeContext';
import { Skeleton } from '../../../components/ui';
import { useCategories, useFeaturedProducts, useProducts } from '../hooks';
import { ProductCard } from '../components/ProductCard';
import { ProductListSkeleton } from '../components/ProductListSkeleton';
import { IProduct, ICategory } from '../../../types';
import { ProductStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

type NavProp = NativeStackNavigationProp<ProductStackParamList>;

function SectionHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.sectionHeader, { paddingHorizontal: theme.spacing.lg }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.fontSizes.xl }]}>
        {title}
      </Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[styles.viewAll, { color: theme.colors.primary, fontSize: theme.fontSizes.sm }]}>
            View All
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function CategoryItem({ category, onPress }: { category: ICategory; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity style={styles.categoryItem} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.categoryImageContainer,
          {
            backgroundColor: theme.colors.primaryLight + '30',
            borderColor: theme.colors.border,
          },
        ]}
      >
        {category.image ? (
          <Image source={{ uri: category.image }} style={styles.categoryImage} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 28 }}>{'\uD83C\uDF3F'}</Text>
        )}
      </View>
      <Text
        style={[styles.categoryName, { color: theme.colors.text, fontSize: theme.fontSizes.xs }]}
        numberOfLines={2}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

export function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavProp>();

  const { data: categoriesRes, isLoading: loadingCategories, refetch: refetchCategories } = useCategories();
  const { data: featuredRes, isLoading: loadingFeatured, refetch: refetchFeatured } = useFeaturedProducts();
  const { data: allProductsRes, isLoading: loadingAll, refetch: refetchAll } = useProducts({ page: 1, limit: 6 });

  const [refreshing, setRefreshing] = useState(false);

  const categories = categoriesRes?.data ?? [];
  const featuredProducts = featuredRes?.data ?? [];
  const allProducts = allProductsRes?.data ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchFeatured(), refetchAll()]);
    setRefreshing(false);
  }, [refetchCategories, refetchFeatured, refetchAll]);

  const renderFeaturedProduct = useCallback(
    ({ item }: { item: IProduct }) => (
      <View style={{ width: 170, marginRight: 12 }}>
        <ProductCard product={item} horizontal />
      </View>
    ),
    [],
  );

  const renderCategory = useCallback(
    ({ item }: { item: ICategory }) => (
      <CategoryItem
        category={item}
        onPress={() =>
          navigation.navigate('ProductList', { category: item._id, title: item.name })
        }
      />
    ),
    [navigation],
  );

  const renderAllProduct = useCallback(
    ({ item }: { item: IProduct }) => (
      <View style={{ width: CARD_WIDTH }}>
        <ProductCard product={item} />
      </View>
    ),
    [],
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Search Bar */}
      <TouchableOpacity
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
            marginHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.lg,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={{ fontSize: 18, marginRight: 8, color: theme.colors.textSecondary }}>
          {'\uD83D\uDD0D'}
        </Text>
        <Text style={[styles.searchPlaceholder, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.base }]}>
          Search products...
        </Text>
      </TouchableOpacity>

      {/* Hero Banner */}
      <View
        style={[
          styles.heroBanner,
          {
            backgroundColor: '#5C6B3C',
            marginHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.lg,
            borderRadius: theme.borderRadius.lg,
          },
        ]}
      >
        <Text style={styles.heroSubtitle}>Premium Quality</Text>
        <Text style={styles.heroTitle}>Natural & Organic{'\n'}Products</Text>
        <Text style={styles.heroTagline}>
          Farm-fresh spices, dry fruits & superfoods delivered to your door
        </Text>
        <TouchableOpacity
          style={[styles.heroButton, { borderRadius: theme.borderRadius.sm }]}
          onPress={() => navigation.navigate('ProductList', { title: 'All Products' })}
        >
          <Text style={styles.heroButtonText}>Shop Now</Text>
        </TouchableOpacity>
      </View>

      {/* Shop by Category */}
      <View style={{ marginTop: theme.spacing['2xl'] }}>
        <SectionHeader title="Shop by Category" />
        {loadingCategories ? (
          <View style={[styles.categorySkeleton, { paddingHorizontal: theme.spacing.lg }]}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.categoryItem}>
                <Skeleton width={64} height={64} borderRadius={32} />
                <Skeleton width={50} height={10} borderRadius={4} style={{ marginTop: 6 }} />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          />
        )}
      </View>

      {/* Featured Products */}
      <View style={{ marginTop: theme.spacing['2xl'] }}>
        <SectionHeader
          title="Featured Products"
          onViewAll={() => navigation.navigate('ProductList', { title: 'Featured Products' })}
        />
        {loadingFeatured ? (
          <View style={{ paddingHorizontal: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={{ width: 170 }}>
                  <Skeleton width={170} height={180} borderRadius={theme.borderRadius.md} />
                  <Skeleton width={120} height={14} borderRadius={4} style={{ marginTop: 8 }} />
                  <Skeleton width={80} height={16} borderRadius={4} style={{ marginTop: 4 }} />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            data={featuredProducts}
            renderItem={renderFeaturedProduct}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
          />
        )}
      </View>

      {/* All Products Grid */}
      <View style={{ marginTop: theme.spacing['2xl'], marginBottom: theme.spacing['3xl'] }}>
        <SectionHeader
          title="All Products"
          onViewAll={() => navigation.navigate('ProductList', { title: 'All Products' })}
        />
        {loadingAll ? (
          <ProductListSkeleton count={4} />
        ) : (
          <View style={styles.productGrid}>
            {allProducts.slice(0, 6).map((product: IProduct) => (
              <View key={product._id} style={{ width: CARD_WIDTH }}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchPlaceholder: {
    flex: 1,
  },
  heroBanner: {
    padding: 24,
    overflow: 'hidden',
  },
  heroSubtitle: {
    color: '#B59F6B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 8,
  },
  heroTagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  heroButton: {
    backgroundColor: '#E84672',
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  viewAll: {
    fontWeight: '600',
  },
  categorySkeleton: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    width: 76,
  },
  categoryImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});

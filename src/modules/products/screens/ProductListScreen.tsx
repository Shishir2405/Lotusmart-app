import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useProducts, useCategories } from '../hooks';
import { ProductCard } from '../components/ProductCard';
import { ProductRow } from '../components/ProductRow';
import { CategoryChip } from '../components/CategoryChip';
import { ProductListSkeleton } from '../components/ProductListSkeleton';
import { FilterDrawer, DEFAULT_FILTERS, FilterState } from '../components/FilterDrawer';
import { IProduct, IProductFilters } from '../../../types';
import { ProductStackParamList } from '../types';
import { useLoadingCap } from '../../../hooks/useLoadingCap';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

type RouteProps = RouteProp<ProductStackParamList, 'ProductList'>;
type ViewMode = 'grid' | 'list';

function countActiveFilters(f: FilterState) {
  return (
    (f.sortBy !== 'newest' ? 1 : 0) +
    (f.minPrice ? 1 : 0) +
    (f.maxPrice ? 1 : 0) +
    (f.isOrganic ? 1 : 0) +
    (f.isVegan ? 1 : 0) +
    (f.isGlutenFree ? 1 : 0) +
    (f.inStock ? 1 : 0)
  );
}

export function ProductListScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const { category: routeCategory, search } = route.params ?? {};

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(routeCategory);
  const [page, setPage] = useState(1);
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [refreshing, setRefreshing] = useState(false);

  const filters = useMemo<IProductFilters>(
    () => ({
      category: selectedCategory,
      search,
      sortBy: filterState.sortBy,
      minPrice: filterState.minPrice,
      maxPrice: filterState.maxPrice,
      isOrganic: filterState.isOrganic || undefined,
      isVegan: filterState.isVegan || undefined,
      isGlutenFree: filterState.isGlutenFree || undefined,
      inStock: filterState.inStock || undefined,
      page,
      limit: 20,
    }),
    [selectedCategory, search, filterState, page],
  );

  const { data: productsRes, isLoading, refetch, isFetching } = useProducts(filters);
  const { data: categoriesRes } = useCategories();
  const showSkeleton = useLoadingCap(isLoading && !productsRes);

  const products = productsRes?.data ?? [];
  const categories = categoriesRes?.data ?? [];
  const pagination = productsRes?.pagination;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  const activeFilters = useMemo(() => countActiveFilters(filterState), [filterState]);

  const handleCategorySelect = useCallback((categoryId?: string) => {
    setSelectedCategory(categoryId);
    setPage(1);
  }, []);

  const handleApplyFilters = useCallback((next: FilterState) => {
    setFilterState(next);
    setPage(1);
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isFetching) setPage((p) => p + 1);
  }, [hasMore, isFetching]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderGridItem = useCallback(
    ({ item }: { item: IProduct }) => (
      <View style={{ width: CARD_WIDTH }}>
        <ProductCard product={item} />
      </View>
    ),
    [],
  );

  const renderListItem = useCallback(
    ({ item }: { item: IProduct }) => (
      <View style={{ marginBottom: 12 }}>
        <ProductRow product={item} />
      </View>
    ),
    [],
  );

  const renderEmpty = useCallback(() => {
    if (showSkeleton) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: COLORS.oliveLight }]}>
          <Ionicons name="search-outline" size={28} color={COLORS.olive} />
        </View>
        <Text
          style={[styles.emptyTitle, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
        >
          No products found
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
          ]}
        >
          Try adjusting your filters or search terms.
        </Text>
      </View>
    );
  }, [showSkeleton, theme]);

  const renderFooter = useCallback(() => {
    if (!isFetching || isLoading) return null;
    return (
      <View style={styles.footer}>
        <Text
          style={[
            styles.footerText,
            { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
          ]}
        >
          Loading more...
        </Text>
      </View>
    );
  }, [isFetching, isLoading, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!search && categories.length > 0 && (
        <CategoryChip
          categories={categories}
          selectedId={selectedCategory}
          onSelect={handleCategorySelect}
        />
      )}

      <View style={styles.toolbar}>
        <Text
          style={[
            styles.count,
            { color: theme.colors.textSecondary, fontFamily: FONTS.body.medium },
          ]}
        >
          {pagination ? `${pagination.total} products` : ' '}
        </Text>

        <View style={styles.toolbarActions}>
          <View
            style={[
              styles.segmented,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setViewMode('grid')}
              style={[styles.segment, viewMode === 'grid' && { backgroundColor: COLORS.rose }]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="grid"
                size={13}
                color={viewMode === 'grid' ? '#FFFFFF' : theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setViewMode('list')}
              style={[styles.segment, viewMode === 'list' && { backgroundColor: COLORS.rose }]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="list"
                size={15}
                color={viewMode === 'list' ? '#FFFFFF' : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setDrawerOpen(true)}
            style={[
              styles.filterBtn,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="options-outline" size={14} color={theme.colors.text} />
            <Text
              style={[
                styles.filterBtnText,
                { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
              ]}
            >
              Filters
            </Text>
            {activeFilters > 0 ? (
              <View style={[styles.filterBadge, { backgroundColor: COLORS.rose }]}>
                <Text style={styles.filterBadgeText}>{activeFilters}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {showSkeleton && page === 1 ? (
        <ProductListSkeleton count={6} />
      ) : viewMode === 'grid' ? (
        <FlatList
          key="grid"
          data={products}
          renderItem={renderGridItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.rose}
            />
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
        />
      ) : (
        <FlatList
          key="list"
          data={products}
          renderItem={renderListItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.rose}
            />
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
        />
      )}

      <FilterDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        value={filterState}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  count: { fontSize: 13 },
  toolbarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterBtnText: { fontSize: 12, letterSpacing: 0.2 },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.body.bold,
  },
  row: { justifyContent: 'space-between' },
  gridContent: { paddingHorizontal: 16, paddingBottom: 24 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  footer: { paddingVertical: 18, alignItems: 'center' },
  footerText: { fontSize: 12 },
});

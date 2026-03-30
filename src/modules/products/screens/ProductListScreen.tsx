import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeContext';
import { useProducts, useCategories } from '../hooks';
import { ProductCard } from '../components/ProductCard';
import { CategoryChip } from '../components/CategoryChip';
import { ProductListSkeleton } from '../components/ProductListSkeleton';
import { IProduct } from '../../../types';
import { ProductStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

type RouteProps = RouteProp<ProductStackParamList, 'ProductList'>;

const SORT_OPTIONS = [
  { label: 'Newest', value: '-createdAt' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Rating', value: '-ratings.average' },
] as const;

export function ProductListScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const { category: routeCategory, search, title } = route.params ?? {};

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(routeCategory);
  const [sort, setSort] = useState<string>('-createdAt');
  const [page, setPage] = useState(1);
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filters = useMemo(
    () => ({
      category: selectedCategory,
      search,
      sort,
      page,
      limit: 20,
    }),
    [selectedCategory, search, sort, page],
  );

  const { data: productsRes, isLoading, refetch, isFetching } = useProducts(filters);
  const { data: categoriesRes } = useCategories();

  const products = productsRes?.data ?? [];
  const categories = categoriesRes?.data ?? [];
  const pagination = productsRes?.pagination;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  const handleCategorySelect = useCallback((categoryId?: string) => {
    setSelectedCategory(categoryId);
    setPage(1);
  }, []);

  const handleSortSelect = useCallback((value: string) => {
    setSort(value);
    setPage(1);
    setShowSortModal(false);
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isFetching]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const selectedSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Sort';

  const renderItem = useCallback(
    ({ item }: { item: IProduct }) => (
      <View style={{ width: CARD_WIDTH }}>
        <ProductCard product={item} />
      </View>
    ),
    [],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>{'\uD83D\uDD0D'}</Text>
        <Text style={[styles.emptyTitle, { color: theme.colors.text, fontSize: theme.fontSizes.lg }]}>
          No products found
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }]}>
          Try adjusting your filters or search terms
        </Text>
      </View>
    );
  }, [isLoading, theme]);

  const renderFooter = useCallback(() => {
    if (!isFetching || isLoading) return null;
    return (
      <View style={styles.footer}>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>
          Loading more...
        </Text>
      </View>
    );
  }, [isFetching, isLoading, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Category Chips */}
      {!search && categories.length > 0 && (
        <CategoryChip
          categories={categories}
          selectedId={selectedCategory}
          onSelect={handleCategorySelect}
        />
      )}

      {/* Sort Bar */}
      <View style={[styles.sortBar, { paddingHorizontal: theme.spacing.lg }]}>
        <Text style={[styles.resultCount, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }]}>
          {pagination ? `${pagination.total} products` : ''}
        </Text>
        <TouchableOpacity
          style={[
            styles.sortButton,
            {
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.sm,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
            },
          ]}
          onPress={() => setShowSortModal(true)}
        >
          <Text style={{ fontSize: 14, marginRight: 4 }}>{'\u2195'}</Text>
          <Text style={[styles.sortButtonText, { color: theme.colors.text, fontSize: theme.fontSizes.sm }]}>
            {selectedSortLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product Grid */}
      {isLoading && page === 1 ? (
        <ProductListSkeleton count={6} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <SafeAreaView>
            <View
              style={[
                styles.sortModal,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
            >
              <Text
                style={[
                  styles.sortModalTitle,
                  { color: theme.colors.text, fontSize: theme.fontSizes.lg },
                ]}
              >
                Sort By
              </Text>
              {SORT_OPTIONS.map((option) => {
                const isActive = sort === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      {
                        backgroundColor: isActive
                          ? theme.colors.primary + '14'
                          : 'transparent',
                        borderRadius: theme.borderRadius.sm,
                      },
                    ]}
                    onPress={() => handleSortSelect(option.value)}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        {
                          color: isActive ? theme.colors.primary : theme.colors.text,
                          fontSize: theme.fontSizes.base,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isActive && (
                      <Text style={{ color: theme.colors.primary, fontSize: 16 }}>{'\u2713'}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultCount: {
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  sortButtonText: {
    fontWeight: '500',
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sortModal: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  sortModalTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 4,
  },
  sortOptionText: {
    fontWeight: '500',
  },
});

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { AppImage } from '../../../components/ui/AppImage';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import { useSearchProducts } from '../hooks';
import { useLoadingCap } from '../../../hooks/useLoadingCap';
import { formatCurrency } from '../../../utils/helpers';
import { IProduct } from '../../../types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

// Search returns a LEAN shape; everything but the mapped fields may be absent.
type SearchResult = Partial<IProduct>;

export function SearchScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const { data: searchRes, isLoading } = useSearchProducts(query);
  const results = searchRes?.data ?? [];
  const showLoader = useLoadingCap(isLoading && results.length === 0);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleProductPress = useCallback(
    (productId: string) => navigation.navigate('ProductDetail', { productId }),
    [navigation],
  );

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: SearchResult; index: number }) => {
      // The search endpoint returns a LEAN shape, so stock/ratings/compareAtPrice/images
      // may be undefined. Guard every field.
      const imageUri = item.images?.[0];
      const price = item.price ?? 0;
      const hasComparePrice = item.compareAtPrice != null && item.compareAtPrice > price;
      const hasStockInfo = typeof item.stock === 'number';

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(250)}>
          <TouchableOpacity
            style={[styles.resultRow, { borderBottomColor: theme.colors.border }]}
            activeOpacity={0.7}
            onPress={() => handleProductPress(item._id ?? '')}
          >
            <AppImage source={{ uri: imageUri }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text
                style={[
                  styles.productName,
                  { color: theme.colors.text, fontFamily: FONTS.body.medium },
                ]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <View style={styles.priceRow}>
                <Text
                  style={[styles.productPrice, { color: COLORS.rose, fontFamily: FONTS.body.bold }]}
                >
                  {formatCurrency(price)}
                </Text>
                {hasComparePrice && (
                  <Text
                    style={[
                      styles.comparePrice,
                      { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                    ]}
                  >
                    {formatCurrency(item.compareAtPrice as number)}
                  </Text>
                )}
              </View>
              {hasStockInfo &&
                ((item.stock as number) > 0 ? (
                  <Text
                    style={{ fontSize: 11, color: COLORS.success, fontFamily: FONTS.body.medium }}
                  >
                    In Stock
                  </Text>
                ) : (
                  <Text
                    style={{ fontSize: 11, color: COLORS.error, fontFamily: FONTS.body.medium }}
                  >
                    Out of Stock
                  </Text>
                ))}
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [theme, handleProductPress],
  );

  const keyExtractor = useCallback(
    (item: SearchResult, index: number) => item._id ?? String(index),
    [],
  );

  const hasQuery = query.trim().length > 0;
  const showEmpty = hasQuery && !showLoader && results.length === 0;
  const showInitial = !hasQuery && !showLoader;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            paddingTop: insets.top + 8,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={theme.colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search spices, dry fruits & more..."
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.searchInput,
              { color: theme.colors.text, fontFamily: FONTS.body.regular },
            ]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {hasQuery && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {showLoader && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.rose} />
          <Text
            style={[
              styles.stateText,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.medium },
            ]}
          >
            Searching...
          </Text>
        </View>
      )}

      {/* Initial Hint */}
      {showInitial && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.centerState}>
          <View style={[styles.hintIcon, { backgroundColor: COLORS.roseLight }]}>
            <Ionicons name="search-outline" size={40} color={COLORS.rose} />
          </View>
          <Text
            style={[
              styles.hintText,
              { color: theme.colors.text, fontFamily: FONTS.heading.semiBold },
            ]}
          >
            What are you looking for?
          </Text>
          <Text
            style={[
              styles.hintSubText,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
            ]}
          >
            Search for spices, dry fruits, gift boxes & more
          </Text>
        </Animated.View>
      )}

      {/* Empty State */}
      {showEmpty && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.centerState}>
          <View style={[styles.hintIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="search-outline" size={40} color="#F59E0B" />
          </View>
          <Text
            style={[
              styles.hintText,
              { color: theme.colors.text, fontFamily: FONTS.heading.semiBold },
            ]}
          >
            No products found
          </Text>
          <Text
            style={[
              styles.hintSubText,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
            ]}
          >
            Try a different search term
          </Text>
        </Animated.View>
      )}

      {/* Results */}
      {results.length > 0 && (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text
              style={[
                styles.resultCount,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.medium },
              ]}
            >
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
  },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 15 },
  listContent: { paddingBottom: 24 },
  resultCount: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 13 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  productImage: { width: 60, height: 60, borderRadius: 10 },
  productInfo: { flex: 1, gap: 3 },
  productName: { fontSize: 15, lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productPrice: { fontSize: 15 },
  comparePrice: { fontSize: 13, textDecorationLine: 'line-through' },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  hintIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stateText: { marginTop: 8, fontSize: 14 },
  hintText: { fontSize: 18, textAlign: 'center' },
  hintSubText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

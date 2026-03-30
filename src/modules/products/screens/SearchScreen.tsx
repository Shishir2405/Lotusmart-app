import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../theme/ThemeContext';
import { useSearchProducts } from '../hooks';
import { formatCurrency } from '../../../utils/helpers';
import { ProductStackParamList } from '../types';
import { IProduct } from '../../../types';

type NavigationProp = NativeStackNavigationProp<ProductStackParamList, 'Search'>;

export function SearchScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const { data: searchRes, isLoading } = useSearchProducts(query);
  const results = searchRes?.data ?? [];

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleProductPress = useCallback(
    (productId: string) => {
      navigation.navigate('ProductDetail', { productId });
    },
    [navigation],
  );

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: IProduct }) => (
      <TouchableOpacity
        style={[
          styles.resultRow,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => handleProductPress(item._id)}
      >
        <Image
          source={{ uri: item.images[0] }}
          style={[styles.productImage, { borderRadius: theme.borderRadius.sm }]}
        />
        <View style={styles.productInfo}>
          <Text
            style={[
              styles.productName,
              { color: theme.colors.text, fontSize: theme.fontSizes.base },
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text
              style={[
                styles.productPrice,
                { color: theme.colors.primary, fontSize: theme.fontSizes.base },
              ]}
            >
              {formatCurrency(item.price)}
            </Text>
            {item.compareAtPrice && item.compareAtPrice > item.price && (
              <Text
                style={[
                  styles.comparePrice,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSizes.sm,
                  },
                ]}
              >
                {formatCurrency(item.compareAtPrice)}
              </Text>
            )}
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    ),
    [theme, handleProductPress],
  );

  const keyExtractor = useCallback((item: IProduct) => item._id, []);

  const hasQuery = query.trim().length > 0;
  const showEmpty = hasQuery && !isLoading && results.length === 0;
  const showInitial = !hasQuery && !isLoading;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
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
            {
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.md,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search products..."
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.searchInput,
              { color: theme.colors.text, fontSize: theme.fontSizes.base },
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
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              styles.stateText,
              { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm },
            ]}
          >
            Searching...
          </Text>
        </View>
      )}

      {/* Initial Hint */}
      {showInitial && (
        <View style={styles.centerState}>
          <Ionicons
            name="search-outline"
            size={64}
            color={theme.colors.border}
          />
          <Text
            style={[
              styles.hintText,
              { color: theme.colors.textSecondary, fontSize: theme.fontSizes.base },
            ]}
          >
            Search for spices, dry fruits & more
          </Text>
        </View>
      )}

      {/* Empty State */}
      {showEmpty && (
        <View style={styles.centerState}>
          <Ionicons
            name="sad-outline"
            size={64}
            color={theme.colors.border}
          />
          <Text
            style={[
              styles.hintText,
              { color: theme.colors.textSecondary, fontSize: theme.fontSizes.base },
            ]}
          >
            No products found
          </Text>
          <Text
            style={[
              styles.hintSubText,
              { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm },
            ]}
          >
            Try a different search term
          </Text>
        </View>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  productImage: {
    width: 60,
    height: 60,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontWeight: '500',
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontWeight: '700',
  },
  comparePrice: {
    textDecorationLine: 'line-through',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  stateText: {
    marginTop: 8,
    fontWeight: '500',
  },
  hintText: {
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  hintSubText: {
    textAlign: 'center',
  },
});

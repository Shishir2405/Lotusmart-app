import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { ICategory } from '../../../types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

interface CategoryChipProps {
  categories: ICategory[];
  // The backend filters products by category *slug*, so selection is slug-based.
  selectedSlug?: string;
  onSelect: (slug?: string) => void;
}

interface ChipItemProps {
  category: { _id: string; name: string; slug: string };
  isActive: boolean;
  onPress: () => void;
}

const ChipItem = React.memo(function ChipItem({ category, isActive, onPress }: ChipItemProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          borderColor: isActive ? COLORS.rose : theme.colors.border,
          backgroundColor: isActive ? COLORS.rose : theme.colors.surface,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: isActive ? '#FFFFFF' : theme.colors.text,
            fontFamily: isActive ? FONTS.body.bold : FONTS.body.medium,
          },
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
});

export function CategoryChip({ categories, selectedSlug, onSelect }: CategoryChipProps) {
  const allChip = { _id: 'all', name: 'All', slug: 'all' };
  const data = [allChip, ...categories];

  const renderItem = useCallback(
    ({ item }: { item: { _id: string; name: string; slug: string } }) => {
      const isActive = item._id === 'all' ? !selectedSlug : selectedSlug === item.slug;
      return (
        <ChipItem
          category={item}
          isActive={isActive}
          onPress={() => onSelect(item._id === 'all' ? undefined : item.slug)}
        />
      );
    },
    [selectedSlug, onSelect],
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});

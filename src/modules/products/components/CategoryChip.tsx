import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { ICategory } from '../../../types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

interface CategoryChipProps {
  categories: ICategory[];
  selectedId?: string;
  onSelect: (categoryId?: string) => void;
}

interface ChipItemProps {
  category: { _id: string; name: string };
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

export function CategoryChip({ categories, selectedId, onSelect }: CategoryChipProps) {
  const allChip = { _id: 'all', name: 'All' };
  const data = [allChip, ...categories];

  const renderItem = useCallback(
    ({ item }: { item: { _id: string; name: string } }) => {
      const isActive = item._id === 'all' ? !selectedId : selectedId === item._id;
      return (
        <ChipItem
          category={item}
          isActive={isActive}
          onPress={() => onSelect(item._id === 'all' ? undefined : item._id)}
        />
      );
    },
    [selectedId, onSelect],
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
    paddingVertical: 10,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});

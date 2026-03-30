import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { ICategory } from '../../../types';

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
          borderRadius: theme.borderRadius.full,
          borderColor: isActive ? theme.colors.primary : theme.colors.border,
          backgroundColor: isActive ? theme.colors.primary : 'transparent',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: isActive ? '#FFFFFF' : theme.colors.text,
            fontSize: theme.fontSizes.sm,
          },
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
});

export function CategoryChip({ categories, selectedId, onSelect }: CategoryChipProps) {
  const { theme } = useTheme();

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
      contentContainerStyle={[styles.list, { paddingHorizontal: theme.spacing.lg }]}
      ItemSeparatorComponent={() => <View style={{ width: theme.spacing.sm }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  chip: {
    borderWidth: 1.5,
  },
  chipText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

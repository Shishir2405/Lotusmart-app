import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const STAR_COLOR = '#F59E0B';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
}

export function RatingStars({ rating, count, size = 'md' }: RatingStarsProps) {
  const { theme } = useTheme();

  const isSmall = size === 'sm';
  const starSize = isSmall ? 14 : 18;
  const fontSize = isSmall ? theme.fontSizes.xs : theme.fontSizes.sm;

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push('star');
    } else if (rating >= i - 0.5) {
      stars.push('star-half');
    } else {
      stars.push('star-outline');
    }
  }

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    starsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
    },
    countText: {
      fontSize,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {stars.map((iconName, index) => (
          <Ionicons
            key={index}
            name={iconName as keyof typeof Ionicons.glyphMap}
            size={starSize}
            color={STAR_COLOR}
          />
        ))}
      </View>
      {count != null && <Text style={styles.countText}>({count} reviews)</Text>}
    </View>
  );
}

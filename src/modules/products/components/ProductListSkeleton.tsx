import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Skeleton } from '../../../components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

function SkeletonCard() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          width: CARD_WIDTH,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.md,
        },
      ]}
    >
      <Skeleton
        width="100%"
        height={180}
        borderRadius={0}
        style={{
          borderTopLeftRadius: theme.borderRadius.md,
          borderTopRightRadius: theme.borderRadius.md,
        }}
      />
      <View style={[styles.content, { padding: theme.spacing.sm }]}>
        <Skeleton width="85%" height={14} borderRadius={4} />
        <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
        <Skeleton width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
        <View style={styles.priceRow}>
          <Skeleton width="40%" height={16} borderRadius={4} />
          <Skeleton width="30%" height={12} borderRadius={4} />
        </View>
        <Skeleton
          width="100%"
          height={32}
          borderRadius={theme.borderRadius.sm}
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  );
}

interface ProductListSkeletonProps {
  count?: number;
}

export function ProductListSkeleton({ count = 6 }: ProductListSkeletonProps) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  card: {
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  content: {
    gap: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
});

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeContext';
import { Theme } from '../../../theme';
import { Skeleton } from '../../../components/ui';
import { useReels } from '../hooks';
import { IReel } from '../types';
import { ReelCard } from './ReelCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const H_PADDING = 16;
const GAP = 12;
// ~2.2 cards visible so the third peeks in and the row reads as scrollable.
const CARD_WIDTH = Math.round((SCREEN_WIDTH - H_PADDING * 2 - GAP * 2) / 2.2);
const CARD_HEIGHT = Math.round((CARD_WIDTH * 16) / 9);
const SNAP_INTERVAL = CARD_WIDTH + GAP;

function CarouselSkeleton({ styles }: { styles: ReturnType<typeof getStyles> }) {
  return (
    <View style={styles.skeletonRow}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} width={CARD_WIDTH} height={CARD_HEIGHT} borderRadius={12} />
      ))}
    </View>
  );
}

/**
 * Home-screen "Watch & Buy" section.
 *
 * Renders NOTHING at all when the query errors or comes back empty — no bare
 * heading, no reserved gap. The Home screen already wraps this in a spacing
 * View, so returning null must also collapse that: callers should not add
 * margin around it unless they also check for reels.
 */
export function WatchAndBuyCarousel() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  // The 'Reels' route is registered by the navigator; typing it here would
  // require editing the shared RootStackParamList, which is out of scope.
  const navigation = useNavigation<any>();

  const { data, isLoading, isError } = useReels();

  const reels = useMemo<IReel[]>(() => data?.data ?? [], [data]);

  const handleViewAll = useCallback(() => {
    navigation.navigate('Reels');
  }, [navigation]);

  const handlePressReel = useCallback(
    (reel: IReel) => {
      // Matches the registered route param shape: { initialReelId?: string }.
      navigation.navigate('Reels', { initialReelId: reel._id });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: IReel }) => (
      <ReelCard reel={item} width={CARD_WIDTH} onPress={() => handlePressReel(item)} />
    ),
    [handlePressReel],
  );

  const keyExtractor = useCallback((item: IReel) => item._id, []);

  const renderSeparator = useCallback(() => <View style={{ width: GAP }} />, []);

  // Loading: show the section with skeletons so the layout doesn't jump.
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Watch &amp; Buy</Text>
        </View>
        <CarouselSkeleton styles={styles} />
      </View>
    );
  }

  // Error or empty: render nothing. A shoppable-video row with no videos is
  // worse than no row at all.
  if (isError || reels.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>Watch &amp; Buy</Text>
          <Text style={styles.subheading}>Shop straight from the video</Text>
        </View>
        <TouchableOpacity
          onPress={handleViewAll}
          style={styles.viewAllBtn}
          accessibilityRole="button"
          accessibilityLabel="View all reels"
        >
          <Text style={styles.viewAll}>View All</Text>
          <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={reels}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={renderSeparator}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={3}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    // The section owns its own top margin rather than letting the Home screen
    // wrap it in a spacer View — when this component returns null (no reels /
    // error) a wrapper's margin would survive as an unexplained 28px gap.
    container: {
      width: '100%',
      marginTop: 28,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: H_PADDING,
      marginBottom: 14,
    },
    headingBlock: {
      flex: 1,
    },
    heading: {
      fontFamily: theme.fonts.heading.bold,
      fontSize: 22,
      color: theme.colors.text,
      textAlign: 'left',
    },
    subheading: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewAll: {
      fontFamily: theme.fonts.body.semiBold,
      fontSize: 13,
      color: theme.colors.primary,
    },
    listContent: {
      paddingHorizontal: H_PADDING,
    },
    skeletonRow: {
      flexDirection: 'row',
      gap: GAP,
      paddingHorizontal: H_PADDING,
    },
  });

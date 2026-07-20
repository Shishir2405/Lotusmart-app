import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppImage } from '../../../components/ui/AppImage';
import { useTheme } from '../../../theme/ThemeContext';
import { Theme } from '../../../theme';
import { IReel } from '../types';

export const REEL_CARD_WIDTH = 150;
// 9:16 portrait, the shape every vertical-video platform uses.
export const REEL_CARD_HEIGHT = Math.round((REEL_CARD_WIDTH * 16) / 9);

interface ReelCardProps {
  reel: IReel;
  onPress: () => void;
  width?: number;
}

function ReelCardInner({ reel, onPress, width = REEL_CARD_WIDTH }: ReelCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const height = Math.round((width * 16) / 9);
  // The caption is the richer line when present; fall back to the title so the
  // scrim is never empty.
  const subtitle = reel.caption?.trim() || undefined;
  const productCount = reel.products?.length ?? 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { width, height }]}
      accessibilityRole="button"
      accessibilityLabel={`Watch ${reel.title}`}
    >
      {reel.thumbnailUrl ? (
        <AppImage source={{ uri: reel.thumbnailUrl }} style={styles.poster} />
      ) : (
        <View style={styles.posterFallback}>
          <Ionicons name="videocam-outline" size={28} color={theme.colors.textSecondary} />
        </View>
      )}

      {/* Bottom scrim so white text stays readable over any thumbnail. */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.82)']}
        locations={[0, 0.45, 1]}
        style={styles.scrim}
        pointerEvents="none"
      />

      {/* Play affordance */}
      <View style={styles.playBadge} pointerEvents="none">
        <Ionicons name="play" size={13} color="#FFFFFF" />
      </View>

      {/* Shoppable hint */}
      {productCount > 0 && (
        <View style={styles.productBadge} pointerEvents="none">
          <Ionicons name="bag-handle" size={10} color="#FFFFFF" />
          <Text style={styles.productBadgeText}>{productCount}</Text>
        </View>
      )}

      <View style={styles.textBlock} pointerEvents="none">
        <Text style={styles.title} numberOfLines={2}>
          {reel.title}
        </Text>
        {subtitle && (
          <Text style={styles.caption} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export const ReelCard = React.memo(ReelCardInner);

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    poster: {
      ...StyleSheet.absoluteFillObject,
    },
    posterFallback: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.border,
    },
    scrim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '58%',
    },
    playBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      // Video-overlay scrim colour — intentionally not themed.
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    productBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
    },
    productBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontFamily: theme.fonts.body.bold,
    },
    textBlock: {
      position: 'absolute',
      left: 10,
      right: 10,
      bottom: 10,
      gap: 2,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 13,
      lineHeight: 17,
      fontFamily: theme.fonts.body.semiBold,
    },
    caption: {
      color: 'rgba(255,255,255,0.82)',
      fontSize: 11,
      fontFamily: theme.fonts.body.regular,
    },
  });

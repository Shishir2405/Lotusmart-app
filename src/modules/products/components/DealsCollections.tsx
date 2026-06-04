import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { useBanners } from '../../banners/hooks';
import { RootStackParamList } from '../../../app/navigation/types';
import { FONTS } from '../../../config/fonts';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ====== STATIC FALLBACK CONTENT (mirrors the website's Deals & Collections) ======

const STATIC_PRIMARY = {
  eyebrow: 'Limited Time',
  tag: 'This Week Only',
  headline: 'Spice Bundle',
  highlight: '20% Off',
  body: 'Any 5-spice combo box. Handpicked, freshly packed, zero additives.',
  ctaLabel: 'Shop the Deal',
  stat: 'Save ₹120 avg',
  image: undefined as string | undefined,
  link: '/category/spices',
  gradient: ['#1c1610', '#3a2e10'] as [string, string],
  accentColor: '#FFE08A',
};

const STATIC_SECONDARIES: SecondaryCard[] = [
  {
    id: 'gift-boxes',
    eyebrow: 'Gifting',
    headline: 'Custom Hampers',
    body: 'From ₹799. Same-day dispatch. Built to impress.',
    icon: 'gift-outline',
    image: undefined,
    link: '/category/gift-boxes',
    gradient: ['#4a0f1e', '#8b1e3e'],
    accentColor: '#FFD6E0',
  },
  {
    id: 'organic',
    eyebrow: 'New In',
    headline: 'Organic Range',
    body: 'FSSAI-certified. No pesticides. Just honest food.',
    icon: 'leaf-outline',
    image: undefined,
    link: '/category/organic',
    gradient: ['#052e16', '#14532d'],
    accentColor: '#BBF7D0',
  },
];

interface SecondaryCard {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  image?: string;
  link?: string;
  gradient: [string, string];
  accentColor: string;
}

export function DealsCollections() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { data: bannersRes } = useBanners('sidebar');

  const remote = bannersRes?.data ?? [];

  // First sidebar banner (if any) powers the large promo card; the rest fill
  // the two smaller cards. Everything falls back to the website copy.
  const primary = useMemo(() => {
    const b = remote[0];
    if (!b) return STATIC_PRIMARY;
    return {
      ...STATIC_PRIMARY,
      headline: b.title || STATIC_PRIMARY.headline,
      body: b.subtitle || STATIC_PRIMARY.body,
      image: b.image,
      link: b.link || STATIC_PRIMARY.link,
    };
  }, [remote]);

  const secondaries = useMemo<SecondaryCard[]>(() => {
    const rest = remote.slice(1, 3);
    if (rest.length === 0) return STATIC_SECONDARIES;
    return rest.map((b, i) => ({
      ...STATIC_SECONDARIES[i] ?? STATIC_SECONDARIES[0],
      id: b._id,
      headline: b.title || STATIC_SECONDARIES[i]?.headline || 'Explore',
      body: b.subtitle || STATIC_SECONDARIES[i]?.body || '',
      image: b.image,
      link: b.link || STATIC_SECONDARIES[i]?.link,
    }));
  }, [remote]);

  const onCardPress = (link?: string) => {
    if (!link) {
      navigation.navigate('ProductList', { title: 'All Products' });
      return;
    }
    if (link.startsWith('/product/')) {
      navigation.navigate('ProductDetail', { productId: link.replace('/product/', '') });
      return;
    }
    if (link.startsWith('/category/')) {
      const category = link.replace('/category/', '');
      navigation.navigate('ProductList', { category, title: category });
      return;
    }
    if (link.startsWith('http')) {
      void Linking.openURL(link);
      return;
    }
    navigation.navigate('ProductList', { title: 'All Products' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.eyebrowRow}>
            <View style={[styles.eyebrowLine, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>THIS SEASON</Text>
          </View>
          <Text style={[styles.heading, { color: theme.colors.text }]}>
            Deals & <Text style={{ color: theme.colors.primary }}>Collections</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.seeAllBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ProductList', { title: 'Offers' })}
        >
          <Text style={[styles.seeAll, { color: theme.colors.primary }]}>See all offers</Text>
          <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Large promo card */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onCardPress(primary.link)}
        style={styles.primaryCard}
      >
        {primary.image ? (
          <>
            <Image source={{ uri: primary.image }} style={styles.cardImage} />
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.85)']}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <LinearGradient
            colors={primary.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Top row: eyebrow pill + discount badge */}
        <View style={styles.primaryTopRow}>
          <View style={styles.eyebrowPill}>
            <Ionicons name="time-outline" size={11} color={primary.accentColor} />
            <Text style={[styles.eyebrowPillText, { color: primary.accentColor }]}>
              {primary.eyebrow}
            </Text>
          </View>
          <View style={[styles.discountBadge, { backgroundColor: primary.accentColor }]}>
            <Text style={styles.discountValue}>20%</Text>
            <Text style={styles.discountLabel}>OFF</Text>
          </View>
        </View>

        {/* Bottom content */}
        <View style={styles.primaryBottom}>
          <Text style={[styles.primaryTag, { color: primary.accentColor }]}>{primary.tag}</Text>
          <Text style={[styles.primaryHeadline, { color: primary.accentColor }]}>
            {primary.headline}
          </Text>
          <Text style={[styles.primaryBody, { color: primary.accentColor }]} numberOfLines={2}>
            {primary.body}
          </Text>
          <View style={styles.primaryCtaRow}>
            <View style={[styles.primaryCta, { backgroundColor: primary.accentColor }]}>
              <Text style={styles.primaryCtaText}>{primary.ctaLabel}</Text>
              <Ionicons name="arrow-forward" size={14} color="#2a2518" />
            </View>
            <Text style={[styles.primaryStat, { color: primary.accentColor }]}>{primary.stat}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Two smaller cards */}
      <View style={styles.secondaryRow}>
        {secondaries.map((b) => (
          <TouchableOpacity
            key={b.id}
            activeOpacity={0.92}
            onPress={() => onCardPress(b.link)}
            style={styles.secondaryCard}
          >
            {b.image ? (
              <>
                <Image source={{ uri: b.image }} style={styles.cardImage} />
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.82)']}
                  style={StyleSheet.absoluteFill}
                />
              </>
            ) : (
              <LinearGradient
                colors={b.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}

            <View style={styles.secondaryTopRow}>
              <View style={styles.secondaryEyebrowRow}>
                <Ionicons name={b.icon} size={11} color={b.accentColor} />
                <Text style={[styles.secondaryEyebrow, { color: b.accentColor }]}>{b.eyebrow}</Text>
              </View>
              <View style={styles.secondaryArrow}>
                <Ionicons name="arrow-forward" size={13} color={b.accentColor} />
              </View>
            </View>

            <View>
              <Text style={[styles.secondaryHeadline, { color: b.accentColor }]}>{b.headline}</Text>
              <Text style={[styles.secondaryBody, { color: b.accentColor }]} numberOfLines={2}>
                {b.body}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Perks strip */}
      <View style={styles.perksRow}>
        {['Free shipping ₹500+', 'Pan-India delivery', 'Bulk discounts', 'Same-day dispatch'].map(
          (item, i) => (
            <View key={i} style={styles.perkItem}>
              <Ionicons name="flash" size={10} color={theme.colors.primary} />
              <Text style={[styles.perkText, { color: theme.colors.accent }]}>{item}</Text>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eyebrowLine: {
    width: 24,
    height: 1.5,
  },
  eyebrow: {
    fontFamily: FONTS.body.bold,
    fontSize: 10,
    letterSpacing: 2,
  },
  heading: {
    fontFamily: FONTS.heading.bold,
    fontSize: 22,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAll: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 13,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  primaryCard: {
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 20,
  },
  primaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,224,138,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,224,138,0.25)',
  },
  eyebrowPillText: {
    fontFamily: FONTS.body.bold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  discountBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountValue: {
    fontFamily: FONTS.heading.extraBold,
    fontSize: 18,
    color: '#2a2518',
    lineHeight: 20,
  },
  discountLabel: {
    fontFamily: FONTS.body.bold,
    fontSize: 9,
    letterSpacing: 1,
    color: '#2a2518',
  },
  primaryBottom: {},
  primaryTag: {
    fontFamily: FONTS.body.bold,
    fontSize: 10,
    letterSpacing: 1.6,
    opacity: 0.85,
    marginBottom: 6,
  },
  primaryHeadline: {
    fontFamily: FONTS.heading.extraBold,
    fontSize: 38,
    lineHeight: 40,
    marginBottom: 8,
  },
  primaryBody: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.75,
    maxWidth: '85%',
    marginBottom: 14,
  },
  primaryCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
  },
  primaryCtaText: {
    fontFamily: FONTS.body.bold,
    fontSize: 13,
    color: '#2a2518',
  },
  primaryStat: {
    fontFamily: FONTS.body.bold,
    fontSize: 11,
    opacity: 0.7,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  secondaryCard: {
    flex: 1,
    height: 170,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 16,
  },
  secondaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  secondaryEyebrow: {
    fontFamily: FONTS.body.bold,
    fontSize: 9,
    letterSpacing: 1.2,
    opacity: 0.85,
  },
  secondaryArrow: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  secondaryHeadline: {
    fontFamily: FONTS.heading.extraBold,
    fontSize: 19,
    lineHeight: 22,
    marginBottom: 5,
  },
  secondaryBody: {
    fontFamily: FONTS.body.regular,
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.72,
  },
  perksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 16,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  perkText: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 11,
  },
});

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  Linking,
  StyleSheet,
  RefreshControl,
  Dimensions,
  TextInput,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { Skeleton } from '../../../components/ui';
import { useCategories, useFeaturedProducts, useProducts } from '../hooks';
import { useLoadingCap } from '../../../hooks/useLoadingCap';
import { useBanners } from '../../banners/hooks';
import { useFAQs } from '../../site-config/hooks';
import type { FAQItem } from '../../site-config/api';
import { ProductCard } from '../components/ProductCard';
import { ProductListSkeleton } from '../components/ProductListSkeleton';
import { HomeHeader } from '../../../components/shared/HomeHeader';
import { IProduct, ICategory } from '../../../types';
import { RootStackParamList } from '../../../app/navigation/types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ====== HERO BANNER CAROUSEL ======

const HERO_SLIDES = [
  {
    tag: 'Premium Collection',
    title: 'Pure & Natural',
    titleHighlight: 'Spices',
    subtitle: 'Farm-fresh whole & ground spices sourced directly from Indian farms.',
    bgColor: ['#5C6B3C', '#3E4A28'] as [string, string],
    accentColor: '#B59F6B',
    ctaText: 'Shop Spices',
  },
  {
    tag: 'Handpicked Quality',
    title: 'Premium',
    titleHighlight: 'Dry Fruits',
    subtitle: 'Finest quality almonds, cashews, pistachios & more at best prices.',
    bgColor: ['#7A6E42', '#5C5230'] as [string, string],
    accentColor: '#E8567F',
    ctaText: 'Shop Dry Fruits',
  },
  {
    tag: 'Gift Something Special',
    title: 'Curated',
    titleHighlight: 'Gift Boxes',
    subtitle: 'Beautiful gift hampers for every occasion. Perfect for festivals & celebrations.',
    bgColor: ['#8B4B6B', '#6B3550'] as [string, string],
    accentColor: '#B59F6B',
    ctaText: 'View Collection',
  },
];

const COLOR_SCHEMES: Record<string, { bg: [string, string]; accent: string }> = {
  amber: { bg: ['#B45309', '#7C3E08'], accent: '#FCD34D' },
  olive: { bg: ['#5C6B3C', '#3E4A28'], accent: '#B59F6B' },
  rose: { bg: ['#8B4B6B', '#6B3550'], accent: '#F9B4C7' },
  emerald: { bg: ['#065F46', '#043F30'], accent: '#6EE7B7' },
  sky: { bg: ['#075985', '#0C4A6E'], accent: '#7DD3FC' },
};

function HeroBanner({ onShopPress }: { onShopPress: () => void }) {
  const navigation = useNavigation<NavProp>();
  const { data: bannersRes } = useBanners('hero');
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<FlatList>(null);

  const remote = bannersRes?.data ?? [];
  const useRemote = remote.length > 0;

  const slides = useMemo(() => {
    if (useRemote) {
      return remote.map((b) => {
        const scheme = COLOR_SCHEMES[b.colorScheme ?? 'olive'] ?? COLOR_SCHEMES.olive;
        return {
          id: b._id,
          tag: b.subtitle ?? '',
          title: b.title,
          titleHighlight: '',
          subtitle: b.subtitle ?? '',
          image: b.image,
          link: b.link,
          bgColor: scheme.bg,
          accentColor: scheme.accent,
          ctaText: 'Shop Now',
        };
      });
    }
    return HERO_SLIDES.map((s, i) => ({
      id: `static-${i}`,
      tag: s.tag,
      title: s.title,
      titleHighlight: s.titleHighlight,
      subtitle: s.subtitle,
      image: undefined as string | undefined,
      link: undefined as string | undefined,
      bgColor: s.bgColor,
      accentColor: s.accentColor,
      ctaText: s.ctaText,
    }));
  }, [useRemote, remote]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % slides.length;
        scrollRef.current?.scrollToOffset({ offset: next * SCREEN_WIDTH, animated: true });
        return next;
      });
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveSlide(index);
  };

  const onSlidePress = (link?: string) => {
    if (!link) {
      onShopPress();
      return;
    }
    if (link.startsWith('/product/')) {
      const productId = link.replace('/product/', '');
      navigation.navigate('ProductDetail', { productId });
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
    onShopPress();
  };

  return (
    <View>
      <FlatList
        ref={scrollRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.92} onPress={() => onSlidePress(item.link)}>
            {item.image ? (
              <View style={[heroStyles.slide, { width: SCREEN_WIDTH }]}>
                <Image source={{ uri: item.image }} style={heroStyles.slideImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.65)']}
                  style={heroStyles.imageOverlay}
                />
                <View style={heroStyles.imageContent}>
                  {item.tag ? (
                    <Text style={[heroStyles.tag, { color: item.accentColor }]}>{item.tag}</Text>
                  ) : null}
                  <Text style={heroStyles.title}>{item.title}</Text>
                  <View
                    style={[heroStyles.cta, { backgroundColor: item.accentColor, marginTop: 10 }]}
                  >
                    <Text style={heroStyles.ctaText}>{item.ctaText}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            ) : (
              <LinearGradient
                colors={item.bgColor}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[heroStyles.slide, { width: SCREEN_WIDTH }]}
              >
                <View style={heroStyles.content}>
                  <Text style={[heroStyles.tag, { color: item.accentColor }]}>{item.tag}</Text>
                  <Text style={heroStyles.title}>
                    {item.title}
                    {item.titleHighlight ? (
                      <>
                        {'\n'}
                        <Text style={[heroStyles.titleHighlight, { color: item.accentColor }]}>
                          {item.titleHighlight}
                        </Text>
                      </>
                    ) : null}
                  </Text>
                  <Text style={heroStyles.subtitle}>{item.subtitle}</Text>
                  <View style={[heroStyles.cta, { backgroundColor: item.accentColor }]}>
                    <Text style={heroStyles.ctaText}>{item.ctaText}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </View>

                  <View style={heroStyles.trustRow}>
                    <View style={heroStyles.trustBadge}>
                      <Ionicons name="leaf-outline" size={12} color="rgba(255,255,255,0.7)" />
                      <Text style={heroStyles.trustText}>100% Natural</Text>
                    </View>
                    <View style={heroStyles.trustBadge}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={12}
                        color="rgba(255,255,255,0.7)"
                      />
                      <Text style={heroStyles.trustText}>FSSAI Certified</Text>
                    </View>
                    <View style={heroStyles.trustBadge}>
                      <Ionicons name="car-outline" size={12} color="rgba(255,255,255,0.7)" />
                      <Text style={heroStyles.trustText}>Free Shipping</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            )}
          </TouchableOpacity>
        )}
      />

      <View style={heroStyles.indicatorRow}>
        {slides.map((s, i) => (
          <View
            key={s.id}
            style={[
              heroStyles.indicator,
              {
                backgroundColor: i === activeSlide ? COLORS.rose : '#D6D3D1',
                width: i === activeSlide ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  slide: {
    height: 260,
    justifyContent: 'center',
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  imageContent: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 22,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  tag: {
    fontFamily: FONTS.body.bold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.heading.bold,
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: 8,
  },
  titleHighlight: {
    fontFamily: FONTS.heading.extraBold,
  },
  subtitle: {
    fontFamily: FONTS.body.regular,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  ctaText: {
    fontFamily: FONTS.body.bold,
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  trustRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontFamily: FONTS.body.medium,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  indicator: {
    height: 4,
    borderRadius: 2,
  },
});

// ====== SECTION HEADER ======

function SectionHeader({
  title,
  subtitle,
  onViewAll,
}: {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={[sectionStyles.header, { paddingHorizontal: 16 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[sectionStyles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[sectionStyles.subtitle, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} style={sectionStyles.viewAllBtn}>
          <Text style={[sectionStyles.viewAll, { color: theme.colors.primary }]}>View All</Text>
          <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: FONTS.heading.bold,
    fontSize: 22,
  },
  subtitle: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAll: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 13,
  },
});

// ====== CATEGORY ITEM ======

function CategoryItem({ category, onPress }: { category: ICategory; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity style={catStyles.item} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          catStyles.imageContainer,
          { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border },
        ]}
      >
        {category.image ? (
          <Image source={{ uri: category.image }} style={catStyles.image} resizeMode="cover" />
        ) : (
          <Ionicons name="leaf" size={26} color={theme.colors.secondary} />
        )}
      </View>
      <Text style={[catStyles.name, { color: theme.colors.text }]} numberOfLines={2}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const catStyles = StyleSheet.create({
  item: {
    alignItems: 'center',
    width: 80,
  },
  imageContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontFamily: FONTS.body.medium,
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
});

// ====== BANNER STRIP ======

function BannerStrip() {
  const { theme } = useTheme();

  const items = [
    { icon: 'car-outline' as const, label: 'Free Shipping', sub: 'Orders above \u20B9499' },
    { icon: 'shield-checkmark-outline' as const, label: '100% Authentic', sub: 'Genuine products' },
    { icon: 'cube-outline' as const, label: 'Pan-India', sub: 'Fast delivery' },
    { icon: 'time-outline' as const, label: 'Same Day', sub: 'Quick dispatch' },
  ];

  return (
    <View
      style={[
        bannerStyles.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      {items.map((item, i) => (
        <View key={i} style={bannerStyles.item}>
          <View style={[bannerStyles.iconCircle, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name={item.icon} size={18} color={theme.colors.primary} />
          </View>
          <Text style={[bannerStyles.label, { color: theme.colors.text }]}>{item.label}</Text>
          <Text style={[bannerStyles.sub, { color: theme.colors.textSecondary }]}>{item.sub}</Text>
        </View>
      ))}
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 11,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FONTS.body.regular,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1,
  },
});

// ====== WHY CHOOSE US ======

function WhyChooseUsSection() {
  const { theme } = useTheme();

  const features = [
    {
      icon: 'leaf' as const,
      title: 'Farm Fresh',
      desc: 'Sourced directly from organic farms',
      color: '#16A34A',
    },
    {
      icon: 'shield-checkmark' as const,
      title: 'FSSAI Licensed',
      desc: 'Certified safe & hygienic',
      color: '#E8567F',
    },
    {
      icon: 'star' as const,
      title: '4.9\u2605 Rated',
      desc: '50K+ happy customers',
      color: '#D97706',
    },
    {
      icon: 'cube' as const,
      title: 'Premium Packaging',
      desc: 'Freshness sealed guaranteed',
      color: '#7C3AED',
    },
    {
      icon: 'refresh' as const,
      title: 'Easy Returns',
      desc: 'Hassle-free return policy',
      color: '#0891B2',
    },
    {
      icon: 'flash' as const,
      title: 'Fast Delivery',
      desc: 'Pan-India express shipping',
      color: '#B59F6B',
    },
  ];

  return (
    <View style={whyStyles.container}>
      <Text style={[whyStyles.heading, { color: theme.colors.text }]}>Why Choose LotusMart</Text>
      <Text style={[whyStyles.subheading, { color: theme.colors.textSecondary }]}>
        Our promise of quality & trust
      </Text>

      {/* Stats strip */}
      <View
        style={[
          whyStyles.statsRow,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        {[
          { value: '50K+', label: 'Orders' },
          { value: '4.9\u2605', label: 'Rating' },
          { value: '200+', label: 'Products' },
          { value: '7yr', label: 'In Business' },
        ].map((stat, i) => (
          <View key={i} style={whyStyles.statItem}>
            <Text style={[whyStyles.statValue, { color: theme.colors.primary }]}>{stat.value}</Text>
            <Text style={[whyStyles.statLabel, { color: theme.colors.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Feature grid */}
      <View style={whyStyles.featureGrid}>
        {features.map((f, i) => (
          <View
            key={i}
            style={[
              whyStyles.featureItem,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={[whyStyles.featureIcon, { backgroundColor: f.color + '15' }]}>
              <Ionicons name={f.icon} size={20} color={f.color} />
            </View>
            <Text style={[whyStyles.featureTitle, { color: theme.colors.text }]}>{f.title}</Text>
            <Text style={[whyStyles.featureDesc, { color: theme.colors.textSecondary }]}>
              {f.desc}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const whyStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  heading: {
    fontFamily: FONTS.heading.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.heading.bold,
    fontSize: 18,
  },
  statLabel: {
    fontFamily: FONTS.body.regular,
    fontSize: 11,
    marginTop: 2,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  featureItem: {
    width: (SCREEN_WIDTH - 42) / 2,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: FONTS.body.regular,
    fontSize: 11,
    lineHeight: 16,
  },
});

// ====== FAQ SECTION ======

const STATIC_FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'Are your products 100% natural and chemical-free?',
    answer:
      'Yes! All our spices and dry fruits are sourced directly from farms and are 100% natural, without any artificial colours, flavours, or preservatives.',
    category: 'Products',
    sortOrder: 1,
  },
  {
    id: '2',
    question: 'Do you offer free shipping?',
    answer:
      'Yes, we offer free shipping on all orders above \u20B9499. For orders below \u20B9499, a nominal shipping fee of \u20B949-60 applies.',
    category: 'Shipping',
    sortOrder: 2,
  },
  {
    id: '3',
    question: 'What is your return policy?',
    answer:
      'We offer hassle-free returns within 7 days of delivery. If you receive damaged or wrong products, we will arrange a full refund or replacement.',
    category: 'Returns',
    sortOrder: 3,
  },
  {
    id: '4',
    question: 'How are the products packaged?',
    answer:
      'All products are packed in premium food-grade, airtight packaging to ensure maximum freshness and shelf life.',
    category: 'Products',
    sortOrder: 4,
  },
  {
    id: '5',
    question: 'Do you deliver across India?',
    answer:
      'Yes, we deliver pan-India. Most orders are delivered within 3-7 business days depending on your location.',
    category: 'Shipping',
    sortOrder: 5,
  },
];

function FAQSection({ faqs, onViewAll }: { faqs: FAQItem[]; onViewAll: () => void }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState<number | null>(null);

  const displayFaqs = faqs.length > 0 ? faqs.slice(0, 5) : STATIC_FAQ_DATA;

  return (
    <View style={faqStyles.container}>
      <Text style={[faqStyles.heading, { color: theme.colors.text }]}>
        Frequently Asked Questions
      </Text>
      <Text style={[faqStyles.subheading, { color: theme.colors.textSecondary }]}>
        Got questions? We&apos;ve got answers
      </Text>

      {displayFaqs.map((faq, i) => (
        <TouchableOpacity
          key={faq.id}
          style={[
            faqStyles.item,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={() => setExpanded(expanded === i ? null : i)}
          activeOpacity={0.7}
        >
          <View style={faqStyles.questionRow}>
            <Text style={[faqStyles.question, { color: theme.colors.text }]}>{faq.question}</Text>
            <Ionicons
              name={expanded === i ? 'remove-circle-outline' : 'add-circle-outline'}
              size={22}
              color={theme.colors.primary}
            />
          </View>
          {expanded === i && (
            <View style={[faqStyles.answerContainer, { borderTopColor: theme.colors.border }]}>
              <Text style={[faqStyles.answer, { color: theme.colors.textSecondary }]}>
                {faq.answer}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={faqStyles.viewAllBtn} onPress={onViewAll} activeOpacity={0.7}>
        <Text style={[faqStyles.viewAllText, { color: theme.colors.primary }]}>View All FAQs</Text>
        <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const faqStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  heading: {
    fontFamily: FONTS.heading.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  item: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  question: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  answerContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  answer: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 12,
  },
  viewAllText: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 14,
  },
});

// ====== NEWSLETTER SECTION ======

function NewsletterSection() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email.includes('@')) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <LinearGradient colors={['#5C6B3C', '#3E4A28']} style={nlStyles.container}>
      <Text style={nlStyles.heading}>Stay Updated</Text>
      <Text style={nlStyles.subtext}>
        Subscribe to get exclusive offers, new product launches & seasonal deals.
      </Text>

      {subscribed ? (
        <View style={nlStyles.successRow}>
          <Ionicons name="checkmark-circle" size={24} color="#B59F6B" />
          <Text style={nlStyles.successText}>Thank you for subscribing!</Text>
        </View>
      ) : (
        <View style={nlStyles.inputRow}>
          <TextInput
            style={nlStyles.input}
            placeholder="Enter your email"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={nlStyles.button} onPress={handleSubscribe} activeOpacity={0.8}>
            <Text style={nlStyles.buttonText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={nlStyles.privacy}>No spam, unsubscribe anytime.</Text>
    </LinearGradient>
  );
}

const nlStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  heading: {
    fontFamily: FONTS.heading.bold,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtext: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body.regular,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  button: {
    backgroundColor: '#B59F6B',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: FONTS.body.bold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    fontFamily: FONTS.body.semiBold,
    color: '#B59F6B',
    fontSize: 15,
  },
  privacy: {
    fontFamily: FONTS.body.regular,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 10,
  },
});

// ====== MAIN HOME SCREEN ======

export function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavProp>();

  const {
    data: categoriesRes,
    isLoading: loadingCategories,
    refetch: refetchCategories,
  } = useCategories();
  const {
    data: featuredRes,
    isLoading: loadingFeatured,
    refetch: refetchFeatured,
  } = useFeaturedProducts();
  const {
    data: allProductsRes,
    isLoading: loadingAll,
    refetch: refetchAll,
  } = useProducts({ page: 1, limit: 6 });
  const { data: faqRes, refetch: refetchFAQs } = useFAQs();

  const [refreshing, setRefreshing] = useState(false);

  const categories = categoriesRes?.data ?? [];
  const featuredProducts = featuredRes?.data ?? [];
  const allProducts = allProductsRes?.data ?? [];
  const showCategoriesSkeleton = useLoadingCap(loadingCategories && categories.length === 0);
  const showFeaturedSkeleton = useLoadingCap(loadingFeatured && featuredProducts.length === 0);
  const showAllSkeleton = useLoadingCap(loadingAll && allProducts.length === 0);
  const dynamicFAQs: FAQItem[] = faqRes?.data?.value?.items ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchFeatured(), refetchAll(), refetchFAQs()]);
    setRefreshing(false);
  }, [refetchCategories, refetchFeatured, refetchAll, refetchFAQs]);

  const renderFeaturedProduct = useCallback(
    ({ item }: { item: IProduct }) => (
      <View style={{ width: 170, marginRight: 12 }}>
        <ProductCard product={item} horizontal />
      </View>
    ),
    [],
  );

  const renderCategory = useCallback(
    ({ item }: { item: ICategory }) => (
      <CategoryItem
        category={item}
        onPress={() => navigation.navigate('ProductList', { category: item._id, title: item.name })}
      />
    ),
    [navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header Bar */}
      <HomeHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Hero Banner Carousel */}
        <HeroBanner
          onShopPress={() => navigation.navigate('ProductList', { title: 'All Products' })}
        />

        {/* Banner Strip - Shipping, Authentic, etc */}
        <View style={{ marginTop: 20 }}>
          <BannerStrip />
        </View>

        {/* Shop by Category */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="Shop by Category"
            subtitle="Browse our premium collections"
            onViewAll={() => navigation.navigate('ProductList', { title: 'All Categories' })}
          />
          {showCategoriesSkeleton ? (
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View key={i} style={{ alignItems: 'center', width: 80 }}>
                  <Skeleton width={68} height={68} borderRadius={34} />
                  <Skeleton width={50} height={10} borderRadius={4} style={{ marginTop: 8 }} />
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
            />
          )}
        </View>

        {/* Featured Products */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="Featured Products"
            subtitle="Handpicked for you"
            onViewAll={() => navigation.navigate('ProductList', { title: 'Featured Products' })}
          />
          {showFeaturedSkeleton ? (
            <View style={{ paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={{ width: 170 }}>
                    <Skeleton width={170} height={180} borderRadius={12} />
                    <Skeleton width={120} height={14} borderRadius={4} style={{ marginTop: 8 }} />
                    <Skeleton width={80} height={16} borderRadius={4} style={{ marginTop: 4 }} />
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              data={featuredProducts}
              renderItem={renderFeaturedProduct}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          )}
        </View>

        {/* All Products Grid */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="All Products"
            subtitle="Explore our complete range"
            onViewAll={() => navigation.navigate('ProductList', { title: 'All Products' })}
          />
          {showAllSkeleton ? (
            <ProductListSkeleton count={4} />
          ) : (
            <View style={styles.productGrid}>
              {allProducts.slice(0, 6).map((product: IProduct) => (
                <View key={product._id} style={{ width: CARD_WIDTH }}>
                  <ProductCard product={product} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Why Choose Us */}
        <View style={{ marginTop: 32 }}>
          <WhyChooseUsSection />
        </View>

        {/* FAQ Section */}
        <View style={{ marginTop: 32 }}>
          <FAQSection faqs={dynamicFAQs} onViewAll={() => navigation.navigate('FAQ' as any)} />
        </View>

        {/* Newsletter */}
        <View style={{ marginTop: 32 }}>
          <NewsletterSection />
        </View>

        {/* Footer Links */}
        <View
          style={[
            footerStyles.container,
            { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
          ]}
        >
          <Text style={[footerStyles.heading, { color: theme.colors.text }]}>LotusMart</Text>
          <Text style={[footerStyles.tagline, { color: theme.colors.textSecondary }]}>
            Premium Spices, Dry Fruits & Gifting
          </Text>

          <View style={footerStyles.linksRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('FAQ' as any)}
              style={footerStyles.linkItem}
            >
              <Ionicons name="help-circle-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[footerStyles.linkText, { color: theme.colors.textSecondary }]}>
                FAQs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('Policy', { type: 'terms' })}
              style={footerStyles.linkItem}
            >
              <Ionicons name="document-text-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[footerStyles.linkText, { color: theme.colors.textSecondary }]}>
                Terms & Conditions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('Policy', { type: 'privacy-policy' })}
              style={footerStyles.linkItem}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={[footerStyles.linkText, { color: theme.colors.textSecondary }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('Policy', { type: 'refund-policy' })}
              style={footerStyles.linkItem}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[footerStyles.linkText, { color: theme.colors.textSecondary }]}>
                Refund Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('Policy', { type: 'shipping-policy' })}
              style={footerStyles.linkItem}
            >
              <Ionicons name="car-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[footerStyles.linkText, { color: theme.colors.textSecondary }]}>
                Shipping Policy
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[footerStyles.divider, { borderTopColor: theme.colors.border }]} />
          <Text style={[footerStyles.copyright, { color: theme.colors.textSecondary }]}>
            {'\u00A9'} 2026 LotusMart. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const footerStyles = StyleSheet.create({
  container: {
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderTopWidth: 1,
  },
  heading: {
    fontFamily: FONTS.heading.bold,
    fontSize: 20,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: FONTS.body.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  linksRow: {
    gap: 4,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  linkText: {
    fontFamily: FONTS.body.medium,
    fontSize: 14,
  },
  divider: {
    borderTopWidth: 1,
    marginTop: 16,
    marginBottom: 12,
  },
  copyright: {
    fontFamily: FONTS.body.regular,
    fontSize: 11,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});

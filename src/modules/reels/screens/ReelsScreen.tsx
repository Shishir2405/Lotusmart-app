import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ViewToken,
  LayoutChangeEvent,
  Animated,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AppImage } from '../../../components/ui/AppImage';
import { useTheme } from '../../../theme/ThemeContext';
import { Theme } from '../../../theme';
import { formatCurrency } from '../../../utils/helpers';
import { useInfiniteReels, useLikeReel } from '../hooks';
import { IReel, IReelProduct } from '../types';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

// ====== PER-DEVICE LIKED STATE (AsyncStorage) ======

// Which reels this device has liked. Persisted as a JSON array of reel ids so
// hearts stay filled across app restarts. Loaded once into a shared in-memory
// Set; every reel item reads/writes through this cache to avoid each mount
// hitting disk independently.
const LIKED_STORAGE_KEY = 'lotus_reel_likes';
let likedIdsCache: Set<string> | null = null;
let likedIdsLoad: Promise<Set<string>> | null = null;

async function loadLikedIds(): Promise<Set<string>> {
  if (likedIdsCache) return likedIdsCache;
  if (!likedIdsLoad) {
    likedIdsLoad = (async () => {
      try {
        const raw = await AsyncStorage.getItem(LIKED_STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        likedIdsCache = new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
      } catch {
        // Corrupt/unreadable store — start empty rather than crash.
        likedIdsCache = new Set();
      }
      return likedIdsCache;
    })();
  }
  return likedIdsLoad;
}

async function persistLikedId(reelId: string, liked: boolean): Promise<void> {
  const set = await loadLikedIds();
  if (liked) set.add(reelId);
  else set.delete(reelId);
  try {
    await AsyncStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Persistence is best-effort; an in-memory toggle already happened.
  }
}

// Compact like counts: 999 -> "999", 1200 -> "1.2k", 12345 -> "12k".
// (helpers.ts has no thousands formatter, so this lives here.)
function formatCount(n: number): string {
  if (n < 1000) return `${n}`;
  const value = n / 1000;
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded}k`.replace('.0k', 'k');
}

// ====== SHOPPABLE PRODUCT CARD ======

interface ReelProductCardProps {
  product: IReelProduct;
  styles: ReturnType<typeof getStyles>;
  onPress: (product: IReelProduct) => void;
}

function ReelProductCardInner({ product, styles, onPress }: ReelProductCardProps) {
  // `price` is always the live selling price; `compareAtPrice` is the higher
  // "was" price shown struck through. Guard against an absent/inverted
  // compareAtPrice so we never strike through a lower number than we display.
  const hasDiscount =
    typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price;
  const image = product.images?.[0];
  const isOutOfStock = product.stock === 0;

  const handlePress = useCallback(() => onPress(product), [onPress, product]);

  return (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.85}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View ${product.name}`}
    >
      {image ? (
        <AppImage source={{ uri: image }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productImageFallback]}>
          <Ionicons name="image-outline" size={16} color="rgba(255,255,255,0.7)" />
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.productPriceRow}>
          <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
          {hasDiscount && (
            <Text style={styles.productMrp}>
              {formatCurrency(product.compareAtPrice as number)}
            </Text>
          )}
        </View>
        {isOutOfStock && <Text style={styles.productOutOfStock}>Out of stock</Text>}
      </View>

      <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.75)" />
    </TouchableOpacity>
  );
}

const ReelProductCard = React.memo(ReelProductCardInner);

// ====== FLOATING TOP-RIGHT PRODUCT CARD ======

interface FloatingProductCardProps {
  product: IReelProduct;
  topOffset: number;
  styles: ReturnType<typeof getStyles>;
  onPress: (product: IReelProduct) => void;
}

function FloatingProductCardInner({
  product,
  topOffset,
  styles,
  onPress,
}: FloatingProductCardProps) {
  const hasDiscount =
    typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price;
  const image = product.images?.[0];

  const handlePress = useCallback(() => onPress(product), [onPress, product]);

  return (
    <TouchableOpacity
      style={[styles.floatingCard, { top: topOffset }]}
      activeOpacity={0.85}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View ${product.name}`}
    >
      {image ? (
        <AppImage source={{ uri: image }} style={styles.floatingImage} />
      ) : (
        <View style={[styles.floatingImage, styles.productImageFallback]}>
          <Ionicons name="image-outline" size={16} color="rgba(255,255,255,0.7)" />
        </View>
      )}
      <View style={styles.floatingInfo}>
        <Text style={styles.floatingName} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={styles.productPriceRow}>
          <Text style={styles.floatingPrice}>{formatCurrency(product.price)}</Text>
          {hasDiscount && (
            <Text style={styles.floatingMrp}>
              {formatCurrency(product.compareAtPrice as number)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const FloatingProductCard = React.memo(FloatingProductCardInner);

// ====== SINGLE FULL-SCREEN REEL ======

interface ReelItemProps {
  reel: IReel;
  isActive: boolean;
  isMuted: boolean;
  height: number;
  styles: ReturnType<typeof getStyles>;
  onToggleMute: () => void;
  onPressProduct: (product: IReelProduct) => void;
}

function ReelItemInner({
  reel,
  isActive,
  isMuted,
  height,
  styles,
  onToggleMute,
  onPressProduct,
}: ReelItemProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const hasVideo = !!reel.videoUrl;
  const [isPlaying, setIsPlaying] = useState(false);

  // Like state: `liked` is per-device (AsyncStorage), `likeCount` starts from
  // the server value and is reconciled to the server's response after a toggle.
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(() => reel.likes ?? 0);
  const likeInFlightRef = useRef(false);
  const likeMutation = useLikeReel();
  const heartScale = useRef(new Animated.Value(1)).current;

  // Height of the bottom overlay so the right-side action rail can float just
  // above it (title + caption + product strip) instead of colliding with it.
  const [overlayHeight, setOverlayHeight] = useState(0);

  // `useVideoPlayer` creates a player scoped to THIS item and releases it
  // automatically when the item unmounts (FlatList windowing handles that as
  // you scroll away), so we only have to drive play/pause here.
  const player = useVideoPlayer(hasVideo ? reel.videoUrl : null, (p) => {
    p.loop = true;
    p.muted = isMuted;
  });

  // Play only the reel that is both on-screen AND on a focused screen.
  useEffect(() => {
    if (!hasVideo) return;
    try {
      if (isActive) {
        player.play();
        setIsPlaying(true);
      } else {
        player.pause();
        player.currentTime = 0;
        setIsPlaying(false);
      }
    } catch {
      // Player already released (item unmounting) — nothing to do.
    }
  }, [isActive, hasVideo, player]);

  useEffect(() => {
    if (!hasVideo) return;
    try {
      player.muted = isMuted;
    } catch {
      // Player already released — ignore.
    }
  }, [isMuted, hasVideo, player]);

  // Belt-and-braces: pause on unmount before the hook releases the instance.
  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {
        // Already released.
      }
    };
  }, [player]);

  const handleTogglePlay = useCallback(() => {
    if (!hasVideo) return;
    try {
      if (player.playing) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } catch {
      // Already released — ignore.
    }
  }, [hasVideo, player]);

  // Seed the heart's fill from this device's persisted liked set on mount.
  useEffect(() => {
    let mounted = true;
    loadLikedIds().then((set) => {
      if (mounted) setLiked(set.has(reel._id));
    });
    return () => {
      mounted = false;
    };
  }, [reel._id]);

  const handleOverlayLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setOverlayHeight(h);
  }, []);

  const handleLike = useCallback(() => {
    // Guard against double-fire while a request is already in flight.
    if (likeInFlightRef.current) return;
    likeInFlightRef.current = true;

    const next = !liked;

    // Optimistic UI: flip the heart, nudge the count, pop the icon, persist.
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    heartScale.setValue(0.8);
    Animated.spring(heartScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 140,
    }).start();
    void persistLikedId(reel._id, next);

    likeMutation.mutate(
      { reelId: reel._id, liked: next },
      {
        onSuccess: (result) => {
          // Reconcile to the authoritative server count.
          if (typeof result?.likes === 'number') {
            setLikeCount(Math.max(0, result.likes));
          }
          likeInFlightRef.current = false;
        },
        onError: () => {
          // Revert the optimistic change; never crash the UI on a network error.
          setLiked(!next);
          setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
          void persistLikedId(reel._id, !next);
          likeInFlightRef.current = false;
        },
      },
    );
  }, [liked, reel._id, likeMutation, heartScale]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${reel.title} — Watch & shop on LotusMart\nhttps://lotusmart.in/reels`,
        url: 'https://lotusmart.in/reels',
      });
    } catch {
      // User dismissed the sheet or sharing is unavailable — ignore.
    }
  }, [reel.title]);

  const products = reel.products ?? [];
  const featuredProduct = products[0];
  const caption = reel.caption?.trim();

  const renderProduct = useCallback(
    ({ item }: { item: IReelProduct }) => (
      <ReelProductCard product={item} styles={styles} onPress={onPressProduct} />
    ),
    [styles, onPressProduct],
  );

  const productKeyExtractor = useCallback((item: IReelProduct) => item._id, []);

  return (
    <View style={[styles.reelItem, { height }]}>
      {/* Poster sits underneath the video: it covers the first-frame gap and is
          the only visible layer when a reel has no playable video. */}
      {!!reel.thumbnailUrl && (
        <AppImage source={{ uri: reel.thumbnailUrl }} style={styles.reelPoster} />
      )}

      {hasVideo && (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      )}

      {/* Tap anywhere to pause/resume */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleTogglePlay}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
      />

      {/* Paused indicator */}
      {hasVideo && !isPlaying && isActive && (
        <View style={styles.pausedBadge} pointerEvents="none">
          <Ionicons name="play" size={30} color="#FFFFFF" />
        </View>
      )}

      {/* Bottom scrim keeps the overlay legible over bright footage. */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.4, 1]}
        style={styles.bottomScrim}
        pointerEvents="none"
      />

      {/* Floating shoppable card, top-right. Shows the first product; the full
          list still lives in the bottom strip. */}
      {featuredProduct && (
        <FloatingProductCard
          product={featuredProduct}
          topOffset={insets.top + 10}
          styles={styles}
          onPress={onPressProduct}
        />
      )}

      {/* Right-side action rail: like, share, mute. Floats just above the
          bottom overlay so it never overlaps the product strip. `box-none`
          lets taps on empty space fall through to play/pause + vertical paging. */}
      <View style={[styles.actionRail, { bottom: overlayHeight + 14 }]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          activeOpacity={0.8}
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Unlike this reel' : 'Like this reel'}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={30}
              color={liked ? theme.colors.primary : '#FFFFFF'}
            />
          </Animated.View>
          <Text style={styles.actionLabel}>{formatCount(likeCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
          activeOpacity={0.8}
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Share this reel"
        >
          <Ionicons name="share-social-outline" size={28} color="#FFFFFF" />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>

        {hasVideo && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onToggleMute}
            activeOpacity={0.8}
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={26} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Overlay: copy + shoppable strip */}
      <View
        style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}
        onLayout={handleOverlayLayout}
      >
        <Text style={styles.reelTitle} numberOfLines={2}>
          {reel.title}
        </Text>
        {!!caption && (
          <Text style={styles.reelCaption} numberOfLines={2}>
            {caption}
          </Text>
        )}

        {products.length > 0 && (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={productKeyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.productStrip}
            contentContainerStyle={styles.productStripContent}
            ItemSeparatorComponent={ProductSeparator}
          />
        )}
      </View>
    </View>
  );
}

function ProductSeparator() {
  return <View style={{ width: 10 }} />;
}

const ReelItem = React.memo(ReelItemInner);

// ====== SCREEN ======

export function ReelsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  // 'Reels' is registered by the navigator; typing the param list here would
  // mean editing the shared RootStackParamList, which is out of scope.
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<Record<string, { initialReelId?: string } | undefined>, string>>();
  const initialReelId = route.params?.initialReelId;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  // Measure the real viewport so paging lines up even under a header/tab bar.
  const [itemHeight, setItemHeight] = useState(WINDOW_HEIGHT);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteReels();

  const reels = useMemo<IReel[]>(() => data?.pages.flatMap((pg) => pg.data ?? []) ?? [], [data]);

  const listRef = useRef<FlatList<IReel>>(null);
  // Only honour `initialReelId` once — after that the user's own scrolling wins.
  const hasJumpedRef = useRef(false);

  // Opening a specific reel from the Home carousel: jump to it as soon as it
  // shows up in the loaded pages. If the id isn't on page 1 we simply start at
  // the top rather than paging blindly until we find it.
  useEffect(() => {
    if (hasJumpedRef.current || !initialReelId || reels.length === 0) return;
    const index = reels.findIndex((r) => r._id === initialReelId);
    if (index < 0) return;
    hasJumpedRef.current = true;
    if (index === 0) return;
    setActiveIndex(index);
    // Defer a frame so the list has committed its rows before we scroll.
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index, animated: false });
    });
  }, [initialReelId, reels]);

  // Pause every player when the screen loses focus (navigating to a product,
  // switching tabs, backgrounding) and resume on return.
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => setIsScreenFocused(false);
    }, []),
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setItemHeight(h);
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first && typeof first.index === 'number') {
      setActiveIndex(first.index);
    }
  }).current;

  const handleToggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const handlePressProduct = useCallback(
    (product: IReelProduct) => {
      // Same call ProductCard uses — keep these in sync.
      navigation.navigate('ProductDetail', { productId: product._id });
    },
    [navigation],
  );

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main');
    }
  }, [navigation]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: IReel; index: number }) => (
      <ReelItem
        reel={item}
        isActive={index === activeIndex && isScreenFocused}
        isMuted={isMuted}
        height={itemHeight}
        styles={styles}
        onToggleMute={handleToggleMute}
        onPressProduct={handlePressProduct}
      />
    ),
    [
      activeIndex,
      isScreenFocused,
      isMuted,
      itemHeight,
      styles,
      handleToggleMute,
      handlePressProduct,
    ],
  );

  const keyExtractor = useCallback((item: IReel) => item._id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<IReel> | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight],
  );

  // getItemLayout should make this unreachable, but a failed jump must never
  // leave the feed stranded mid-scroll — fall back to a plain offset scroll.
  const handleScrollToIndexFailed = useCallback(
    (info: { index: number }) => {
      listRef.current?.scrollToOffset({ offset: info.index * itemHeight, animated: false });
    },
    [itemHeight],
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={[styles.footerLoader, { height: itemHeight }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }, [isFetchingNextPage, itemHeight, styles]);

  const backButton = (
    <TouchableOpacity
      style={[styles.backButton, { top: insets.top + 10 }]}
      onPress={handleBack}
      activeOpacity={0.8}
      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.stateText}>Loading reels…</Text>
        </View>
      ) : isError ? (
        <View style={styles.stateContainer}>
          <Ionicons name="cloud-offline-outline" size={44} color="rgba(255,255,255,0.7)" />
          <Text style={styles.stateTitle}>Couldn&apos;t load reels</Text>
          <Text style={styles.stateText}>Check your connection and try again.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.85}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : reels.length === 0 ? (
        <View style={styles.stateContainer}>
          <Ionicons name="videocam-outline" size={44} color="rgba(255,255,255,0.7)" />
          <Text style={styles.stateTitle}>No reels yet</Text>
          <Text style={styles.stateText}>Check back soon for shoppable videos.</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={reels}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
        />
      )}

      {backButton}
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    // The reel feed is a deliberately dark, full-bleed surface — the black
    // backdrop and white-on-scrim overlay text are video chrome, not theme.
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    reelItem: {
      width: '100%',
      backgroundColor: '#000000',
      justifyContent: 'flex-end',
    },
    reelPoster: {
      ...StyleSheet.absoluteFillObject,
    },
    video: {
      ...StyleSheet.absoluteFillObject,
    },
    bottomScrim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '45%',
    },
    pausedBadge: {
      position: 'absolute',
      alignSelf: 'center',
      top: '45%',
      width: 62,
      height: 62,
      borderRadius: 31,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    backButton: {
      position: 'absolute',
      left: 16,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.45)',
      zIndex: 20,
    },
    floatingCard: {
      position: 'absolute',
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 6,
      paddingRight: 10,
      borderRadius: theme.borderRadius.md,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
      width: 168,
      zIndex: 20,
    },
    floatingImage: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    floatingInfo: {
      flex: 1,
      gap: 2,
    },
    floatingName: {
      color: '#FFFFFF',
      fontSize: 12,
      lineHeight: 15,
      fontFamily: theme.fonts.body.semiBold,
    },
    floatingPrice: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: theme.fonts.body.bold,
    },
    floatingMrp: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 10,
      fontFamily: theme.fonts.body.regular,
      textDecorationLine: 'line-through',
    },
    actionRail: {
      position: 'absolute',
      right: 10,
      alignItems: 'center',
      gap: 18,
      zIndex: 20,
    },
    actionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    actionLabel: {
      color: '#FFFFFF',
      fontSize: 11,
      fontFamily: theme.fonts.body.semiBold,
      textShadowColor: 'rgba(0,0,0,0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    overlay: {
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 6,
    },
    reelTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      lineHeight: 24,
      fontFamily: theme.fonts.heading.bold,
    },
    reelCaption: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 13,
      lineHeight: 18,
      fontFamily: theme.fonts.body.regular,
    },
    productStrip: {
      marginTop: 10,
      marginHorizontal: -16,
    },
    productStripContent: {
      paddingHorizontal: 16,
    },
    productCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingRight: 10,
      padding: 6,
      borderRadius: theme.borderRadius.md,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
      maxWidth: 240,
    },
    productImage: {
      width: 42,
      height: 42,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    productImageFallback: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    productInfo: {
      flexShrink: 1,
      gap: 2,
    },
    productName: {
      color: '#FFFFFF',
      fontSize: 12,
      lineHeight: 15,
      fontFamily: theme.fonts.body.semiBold,
    },
    productPriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    productPrice: {
      color: '#FFFFFF',
      fontSize: 13,
      fontFamily: theme.fonts.body.bold,
    },
    productMrp: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 11,
      fontFamily: theme.fonts.body.regular,
      textDecorationLine: 'line-through',
    },
    productOutOfStock: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 10,
      fontFamily: theme.fonts.body.regular,
    },
    stateContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 8,
    },
    stateTitle: {
      color: '#FFFFFF',
      fontSize: 17,
      fontFamily: theme.fonts.body.semiBold,
      marginTop: 4,
    },
    stateText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 13,
      textAlign: 'center',
      fontFamily: theme.fonts.body.regular,
    },
    retryButton: {
      marginTop: 14,
      paddingHorizontal: 22,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.primary,
    },
    retryText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: theme.fonts.body.semiBold,
    },
    footerLoader: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

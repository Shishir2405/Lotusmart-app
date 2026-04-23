import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useLoadingCap } from '../../../hooks/useLoadingCap';
import { useDebounce } from '../../../hooks/useDebounce';
import { useBlogs } from '../hooks';
import { IBlogSummary } from '../api';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';
import { RootStackParamList } from '../../../app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BlogList'>;

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BlogListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading, isFetching, refetch } = useBlogs({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    tag: activeTag,
  });

  const blogs: IBlogSummary[] = data?.data ?? [];
  const pagination = data?.pagination;
  const hasNextPage = pagination ? pagination.page < pagination.totalPages : false;

  const showSkeleton = useLoadingCap(isLoading && blogs.length === 0);

  const tags = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((b) => (b.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).slice(0, 12);
  }, [blogs]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetching) setPage((p) => p + 1);
  }, [hasNextPage, isFetching]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const onSelectTag = useCallback((tag: string) => {
    setPage(1);
    setActiveTag((prev) => (prev === tag ? undefined : tag));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: IBlogSummary }) => (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('BlogDetail', { slug: item.slug })}
      >
        {item.coverImage ? (
          <Image source={{ uri: item.coverImage }} style={styles.cover} />
        ) : (
          <View style={[styles.coverFallback, { backgroundColor: COLORS.roseLight }]}>
            <Ionicons name="newspaper-outline" size={28} color={COLORS.rose} />
          </View>
        )}
        <View style={styles.cardBody}>
          {item.tags?.length ? (
            <View style={styles.tagRow}>
              {item.tags.slice(0, 2).map((t) => (
                <View key={t} style={[styles.tagPill, { backgroundColor: COLORS.goldLight }]}>
                  <Text
                    style={[
                      styles.tagPillText,
                      { color: COLORS.goldDark, fontFamily: FONTS.body.semiBold },
                    ]}
                  >
                    {t}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text
            style={[styles.title, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.excerpt,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
            ]}
            numberOfLines={2}
          >
            {item.excerpt}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={12} color={theme.colors.textSecondary} />
            <Text
              style={[
                styles.meta,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.medium },
              ]}
            >
              {item.author}
            </Text>
            {item.publishedAt ? (
              <>
                <View style={styles.metaDot} />
                <Ionicons name="calendar-outline" size={12} color={theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.meta,
                    { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                  ]}
                >
                  {formatDate(item.publishedAt)}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation, theme],
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={[styles.legalTag, { backgroundColor: COLORS.roseLight }]}>
        <View style={[styles.tagBar, { backgroundColor: COLORS.rose }]} />
        <Text style={[styles.legalTagText, { color: COLORS.rose }]}>JOURNAL</Text>
      </View>
      <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Stories & recipes</Text>
      <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
        Tips, techniques, and tales from our kitchen to yours.
      </Text>

      <View
        style={[
          styles.searchBox,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name="search" size={16} color={theme.colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search stories"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.searchInput, { color: theme.colors.text, fontFamily: FONTS.body.regular }]}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity
            onPress={() => setSearch('')}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="close-circle" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {tags.length > 0 ? (
        <View style={styles.tagRail}>
          <FlatList
            data={tags}
            horizontal
            keyExtractor={(t) => t}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: tag }) => {
              const active = activeTag === tag;
              return (
                <TouchableOpacity
                  onPress={() => onSelectTag(tag)}
                  activeOpacity={0.85}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: active ? COLORS.rose : theme.colors.surface,
                      borderColor: active ? COLORS.rose : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color: active ? '#FFFFFF' : theme.colors.text,
                        fontFamily: FONTS.body.semiBold,
                      },
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          />
        </View>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (showSkeleton) {
      return (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Skeleton width="100%" height={160} borderRadius={0} />
              <View style={styles.cardBody}>
                <Skeleton width={80} height={16} borderRadius={8} style={{ marginBottom: 8 }} />
                <Skeleton width="85%" height={18} style={{ marginBottom: 6 }} />
                <Skeleton width="95%" height={12} style={{ marginBottom: 4 }} />
                <Skeleton width="70%" height={12} />
              </View>
            </View>
          ))}
        </View>
      );
    }
    return (
      <View style={styles.emptyBlock}>
        <View style={[styles.emptyIcon, { backgroundColor: COLORS.oliveLight }]}>
          <Ionicons name="book-outline" size={28} color={COLORS.olive} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No stories yet</Text>
        <Text style={[styles.emptyBody, { color: theme.colors.textSecondary }]}>
          Come back soon — we&apos;re cooking up fresh articles.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <FlatList
        data={blogs}
        renderItem={renderItem}
        keyExtractor={(b) => b._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.rose}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          hasNextPage && isFetching ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={COLORS.rose} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  listContent: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, gap: 12 },
  legalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  legalTagText: { fontFamily: FONTS.body.bold, fontSize: 10, letterSpacing: 2 },
  tagBar: { width: 16, height: 2, borderRadius: 1 },
  pageTitle: { fontFamily: FONTS.heading.bold, fontSize: 26, marginTop: -2 },
  pageSubtitle: { fontFamily: FONTS.body.regular, fontSize: 14, lineHeight: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    marginTop: 2,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  tagRail: { marginTop: 6, marginHorizontal: -4 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterPillText: { fontSize: 12, letterSpacing: 0.2 },
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cover: { width: '100%', height: 180 },
  coverFallback: { width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14, gap: 8 },
  tagRow: { flexDirection: 'row', gap: 6 },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPillText: { fontSize: 10, letterSpacing: 0.3, textTransform: 'uppercase' },
  title: { fontSize: 16, lineHeight: 22 },
  excerpt: { fontSize: 13, lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  meta: { fontSize: 11 },
  metaDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#D6D3D1',
    marginHorizontal: 4,
  },
  emptyBlock: { alignItems: 'center', padding: 40, gap: 10 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontFamily: FONTS.body.bold, fontSize: 15 },
  emptyBody: { fontFamily: FONTS.body.regular, fontSize: 13, textAlign: 'center' },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
});

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  RefreshControl,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import RenderHTML from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useBlog } from '../hooks';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';
import { useLoadingCap } from '../../../hooks/useLoadingCap';

type BlogRouteParams = {
  BlogDetail: { slug: string; title?: string };
};

function looksLikeHtml(s: string) {
  return /<[a-z][\s\S]*>/i.test(s);
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BlogDetailScreen() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const route = useRoute<RouteProp<BlogRouteParams, 'BlogDetail'>>();
  const slug = route.params?.slug;

  const { data, isLoading, isError, isRefetching, refetch } = useBlog(slug);
  const blog = data?.data;
  const showSkeleton = useLoadingCap(isLoading && !blog);

  const htmlBaseStyle = useMemo(
    () => ({
      color: theme.colors.text,
      fontFamily: FONTS.body.regular,
      fontSize: 15,
      lineHeight: 24,
    }),
    [theme.colors.text],
  );

  const tagsStyles = useMemo(
    () => ({
      h1: { fontFamily: FONTS.heading.bold, fontSize: 22, marginTop: 12, marginBottom: 8 },
      h2: { fontFamily: FONTS.heading.bold, fontSize: 19, marginTop: 14, marginBottom: 6 },
      h3: { fontFamily: FONTS.body.bold, fontSize: 17, marginTop: 12, marginBottom: 4 },
      p: { marginBottom: 12 },
      li: { marginBottom: 6 },
      a: { color: COLORS.rose, textDecorationLine: 'underline' as const },
      strong: { fontFamily: FONTS.body.bold },
      b: { fontFamily: FONTS.body.bold },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: COLORS.rose,
        paddingLeft: 12,
        marginVertical: 10,
        opacity: 0.85,
      },
      code: {
        backgroundColor: theme.colors.border + '55',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
      },
    }),
    [theme.colors.border],
  );

  const renderContent = () => {
    if (showSkeleton) {
      return (
        <View style={styles.content}>
          <Skeleton width="100%" height={220} borderRadius={12} />
          <View style={{ paddingHorizontal: 4, marginTop: 14, gap: 10 }}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="95%" height={26} />
            <Skeleton width="80%" height={26} />
            <Skeleton width="40%" height={12} />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} width="100%" height={14} />
            ))}
          </View>
        </View>
      );
    }

    if (isError || !blog) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="cloud-offline-outline" size={36} color={theme.colors.textSecondary} />
          <Text style={[styles.stateTitle, { color: theme.colors.text }]}>
            Couldn&apos;t load this article
          </Text>
          <Text style={[styles.stateBody, { color: theme.colors.textSecondary }]}>
            Please check your connection and try again.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: COLORS.rose }]}
            activeOpacity={0.85}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const published = formatDate(blog.publishedAt || blog.createdAt);
    return (
      <View style={styles.content}>
        {blog.coverImage ? <Image source={{ uri: blog.coverImage }} style={styles.cover} /> : null}

        {blog.tags?.length ? (
          <View style={styles.tagsRow}>
            {blog.tags.slice(0, 4).map((t) => (
              <View key={t} style={[styles.tagPill, { backgroundColor: COLORS.roseLight }]}>
                <Text style={[styles.tagPillText, { color: COLORS.rose }]}>{t.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={[styles.title, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}>
          {blog.title}
        </Text>

        <View style={styles.meta}>
          <Ionicons name="person-circle-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
            {blog.author}
          </Text>
          {published ? (
            <>
              <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {published}
              </Text>
            </>
          ) : null}
          {typeof blog.viewCount === 'number' ? (
            <>
              <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
              <Ionicons name="eye-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {blog.viewCount.toLocaleString('en-IN')} views
              </Text>
            </>
          ) : null}
        </View>

        <Text
          style={[
            styles.excerpt,
            { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
          ]}
        >
          {blog.excerpt}
        </Text>

        <View
          style={[
            styles.contentCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          {looksLikeHtml(blog.content) ? (
            <RenderHTML
              contentWidth={width - 72}
              source={{ html: blog.content }}
              baseStyle={htmlBaseStyle}
              tagsStyles={tagsStyles}
            />
          ) : (
            <Text style={[styles.plainContent, { color: theme.colors.text }]}>{blog.content}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.rose} />
      }
      showsVerticalScrollIndicator={false}
    >
      {renderContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 10 },
  cover: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: '#F3F0EA',
  },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 12 },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPillText: { fontFamily: FONTS.body.bold, fontSize: 10, letterSpacing: 1.2 },
  title: { fontSize: 26, lineHeight: 32 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  metaText: { fontFamily: FONTS.body.medium, fontSize: 12 },
  dot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 4 },
  excerpt: { fontSize: 15, lineHeight: 22, marginTop: 4, marginBottom: 4 },
  contentCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginTop: 4,
  },
  plainContent: {
    fontFamily: FONTS.body.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  stateCard: {
    alignItems: 'center',
    gap: 10,
    padding: 40,
  },
  stateTitle: { fontFamily: FONTS.body.bold, fontSize: 15 },
  stateBody: { fontFamily: FONTS.body.regular, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.body.semiBold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
});

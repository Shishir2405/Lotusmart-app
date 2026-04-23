import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../../theme/ThemeContext';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useLoadingCap } from '../../../hooks/useLoadingCap';
import { useCategoryTree, CategoryNode } from '../hooks';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';
import { RootStackParamList } from '../../../app/navigation/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Row {
  node: CategoryNode;
  depth: number;
}

function flattenVisible(nodes: CategoryNode[], expanded: Set<string>, depth = 0): Row[] {
  const rows: Row[] = [];
  for (const n of nodes) {
    rows.push({ node: n, depth });
    if (n.children.length > 0 && expanded.has(n._id)) {
      rows.push(...flattenVisible(n.children, expanded, depth + 1));
    }
  }
  return rows;
}

function matchesSearch(node: CategoryNode, q: string): boolean {
  if (!q) return true;
  if (node.name.toLowerCase().includes(q)) return true;
  return node.children.some((c) => matchesSearch(c, q));
}

function filterTree(nodes: CategoryNode[], q: string): CategoryNode[] {
  if (!q) return nodes;
  const ql = q.toLowerCase();
  return nodes
    .map((n) => ({ ...n, children: filterTree(n.children, q) }))
    .filter((n) => matchesSearch(n, ql));
}

function collectAllIds(nodes: CategoryNode[]): string[] {
  const ids: string[] = [];
  const walk = (list: CategoryNode[]) => {
    for (const n of list) {
      if (n.children.length > 0) {
        ids.push(n._id);
        walk(n.children);
      }
    }
  };
  walk(nodes);
  return ids;
}

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const { tree, isLoading, isRefetching, refetch } = useCategoryTree();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const showSkeleton = useLoadingCap(isLoading && tree.length === 0);

  const filteredTree = useMemo(() => filterTree(tree, search.trim()), [tree, search]);

  // When searching, auto-expand every node that has visible descendants so
  // matches aren't hidden behind collapsed parents.
  const effectiveExpanded = useMemo(() => {
    if (!search.trim()) return expanded;
    return new Set(collectAllIds(filteredTree));
  }, [search, expanded, filteredTree]);

  const rows = useMemo(
    () => flattenVisible(filteredTree, effectiveExpanded),
    [filteredTree, effectiveExpanded],
  );

  const toggle = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openProducts = useCallback(
    (node: CategoryNode) => {
      navigation.navigate('ProductList', {
        category: node._id,
        title: node.name,
      });
    },
    [navigation],
  );

  const renderRow = useCallback(
    ({ item }: { item: Row }) => {
      const { node, depth } = item;
      const hasChildren = node.children.length > 0;
      const isExpanded = effectiveExpanded.has(node._id);
      const indentStyle = { paddingLeft: 16 + depth * 22 };
      const isTop = depth === 0;
      return (
        <View
          style={[
            styles.rowWrap,
            {
              backgroundColor: isTop ? theme.colors.surface : 'transparent',
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.row, indentStyle]}
            onPress={() => openProducts(node)}
            onLongPress={hasChildren ? () => toggle(node._id) : undefined}
          >
            {isTop && node.image ? (
              <Image source={{ uri: node.image }} style={styles.thumb} />
            ) : (
              <View
                style={[
                  styles.bullet,
                  {
                    backgroundColor: isTop
                      ? COLORS.roseLight
                      : depth === 1
                        ? COLORS.oliveLight
                        : COLORS.goldLight,
                  },
                ]}
              >
                <Ionicons
                  name={isTop ? 'grid-outline' : depth === 1 ? 'leaf-outline' : 'ellipse-outline'}
                  size={isTop ? 16 : 13}
                  color={isTop ? COLORS.rose : depth === 1 ? COLORS.olive : COLORS.gold}
                />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.name,
                  {
                    color: theme.colors.text,
                    fontFamily: isTop ? FONTS.body.bold : FONTS.body.semiBold,
                    fontSize: isTop ? 15 : depth === 1 ? 14 : 13,
                  },
                ]}
                numberOfLines={1}
              >
                {node.name}
              </Text>
              {node.description && isTop ? (
                <Text
                  style={[
                    styles.desc,
                    { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                  ]}
                  numberOfLines={1}
                >
                  {node.description}
                </Text>
              ) : null}
            </View>

            {hasChildren ? (
              <TouchableOpacity
                onPress={() => toggle(node._id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[styles.chevronBtn, { backgroundColor: theme.colors.border + '40' }]}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={14}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            ) : (
              <Ionicons
                name="arrow-forward"
                size={14}
                color={theme.colors.textSecondary}
                style={{ marginRight: 4 }}
              />
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [effectiveExpanded, theme, openProducts, toggle],
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text
        style={[styles.pageTitle, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
      >
        All categories
      </Text>
      <Text
        style={[
          styles.pageSubtitle,
          { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
        ]}
      >
        Browse by section, expand to see sub-categories, tap any to shop it.
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
          placeholder="Search categories"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.searchInput, { color: theme.colors.text, fontFamily: FONTS.body.regular }]}
          autoCorrect={false}
          autoCapitalize="none"
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

      <TouchableOpacity
        onPress={() => navigation.navigate('ProductList', { title: 'All products' } as never)}
        activeOpacity={0.85}
        style={[
          styles.allProductsBtn,
          { borderColor: COLORS.rose + '40', backgroundColor: COLORS.roseLight },
        ]}
      >
        <Ionicons name="albums-outline" size={16} color={COLORS.rose} />
        <Text style={[styles.allProductsText, { color: COLORS.rose, fontFamily: FONTS.body.bold }]}>
          View all products
        </Text>
        <Ionicons name="arrow-forward" size={14} color={COLORS.rose} />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => {
    if (showSkeleton) {
      return (
        <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 8 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View
              key={i}
              style={[
                styles.skeletonRow,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Skeleton width={32} height={32} borderRadius={10} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="85%" height={11} />
              </View>
            </View>
          ))}
        </View>
      );
    }
    return (
      <View style={styles.emptyBlock}>
        <View style={[styles.emptyIcon, { backgroundColor: COLORS.oliveLight }]}>
          <Ionicons name="folder-open-outline" size={28} color={COLORS.olive} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No categories yet</Text>
        <Text style={[styles.emptyBody, { color: theme.colors.textSecondary }]}>
          {search ? `Nothing matched "${search}"` : 'Check back in a bit.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
        <FlatList
          data={rows}
          renderItem={renderRow}
          keyExtractor={(r) => r.node._id}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.rose} />
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 12 },
  pageTitle: { fontSize: 26 },
  pageSubtitle: { fontSize: 13, lineHeight: 18 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  allProductsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  allProductsText: { fontSize: 13, letterSpacing: 0.2 },
  rowWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 14,
    paddingVertical: 12,
  },
  bullet: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3F0EA',
  },
  name: {},
  desc: { fontSize: 11, marginTop: 2 },
  chevronBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
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
});

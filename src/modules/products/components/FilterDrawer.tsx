import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';
import { formatCurrency } from '../../../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(360, SCREEN_WIDTH * 0.88);

export type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'popular';

export interface FilterState {
  sortBy: SortKey;
  minPrice?: number;
  maxPrice?: number;
  isOrganic?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  inStock?: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  sortBy: 'newest',
  minPrice: undefined,
  maxPrice: undefined,
  isOrganic: false,
  isVegan: false,
  isGlutenFree: false,
  inStock: false,
};

const SORTS: { value: SortKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'newest', label: 'Newest first', icon: 'time-outline' },
  { value: 'price_asc', label: 'Price: low to high', icon: 'arrow-up-outline' },
  { value: 'price_desc', label: 'Price: high to low', icon: 'arrow-down-outline' },
  { value: 'popular', label: 'Most popular', icon: 'star-outline' },
];

const DIETARY: {
  key: 'isOrganic' | 'isVegan' | 'isGlutenFree' | 'inStock';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}[] = [
  {
    key: 'isOrganic',
    label: 'Organic',
    icon: 'leaf-outline',
    color: COLORS.olive,
    bg: COLORS.oliveLight,
  },
  { key: 'isVegan', label: 'Vegan', icon: 'flower-outline', color: '#16A34A', bg: '#DCFCE7' },
  {
    key: 'isGlutenFree',
    label: 'Gluten-free',
    icon: 'nutrition-outline',
    color: COLORS.gold,
    bg: COLORS.goldLight,
  },
  {
    key: 'inStock',
    label: 'In stock only',
    icon: 'cube-outline',
    color: COLORS.rose,
    bg: COLORS.roseLight,
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  value: FilterState;
  onApply: (value: FilterState) => void;
}

export function FilterDrawer({ visible, onClose, value, onApply }: Props) {
  const { theme } = useTheme();
  const slide = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const [draft, setDraft] = useState<FilterState>(value);
  const [minText, setMinText] = useState(value.minPrice ? String(value.minPrice) : '');
  const [maxText, setMaxText] = useState(value.maxPrice ? String(value.maxPrice) : '');

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setMinText(value.minPrice ? String(value.minPrice) : '');
      setMaxText(value.maxPrice ? String(value.maxPrice) : '');
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slide.setValue(DRAWER_WIDTH);
      backdrop.setValue(0);
    }
  }, [visible, value, slide, backdrop]);

  const handleApply = () => {
    const parsed: FilterState = {
      ...draft,
      minPrice: minText
        ? Math.max(0, Number(minText.replace(/[^\d.]/g, ''))) || undefined
        : undefined,
      maxPrice: maxText
        ? Math.max(0, Number(maxText.replace(/[^\d.]/g, ''))) || undefined
        : undefined,
    };
    onApply(parsed);
    onClose();
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
    setMinText('');
    setMaxText('');
  };

  const activeCount =
    (draft.sortBy !== 'newest' ? 1 : 0) +
    (draft.minPrice ? 1 : 0) +
    (draft.maxPrice ? 1 : 0) +
    (draft.isOrganic ? 1 : 0) +
    (draft.isVegan ? 1 : 0) +
    (draft.isGlutenFree ? 1 : 0) +
    (draft.inStock ? 1 : 0);

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdrop.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: theme.colors.background,
            transform: [{ translateX: slide }],
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerLeft}>
            <Ionicons name="options-outline" size={18} color={theme.colors.text} />
            <Text
              style={[
                styles.headerTitle,
                { color: theme.colors.text, fontFamily: FONTS.heading.bold },
              ]}
            >
              Filters
            </Text>
            {activeCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: COLORS.rose }]}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.closeBtn, { backgroundColor: theme.colors.border + '55' }]}
          >
            <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sort */}
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Sort by</Text>
          <View style={styles.optionStack}>
            {SORTS.map((s) => {
              const active = draft.sortBy === s.value;
              return (
                <TouchableOpacity
                  key={s.value}
                  activeOpacity={0.85}
                  onPress={() => setDraft((d) => ({ ...d, sortBy: s.value }))}
                  style={[
                    styles.optionRow,
                    {
                      backgroundColor: active ? COLORS.roseLight : theme.colors.surface,
                      borderColor: active ? COLORS.rose + '55' : theme.colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={s.icon}
                    size={16}
                    color={active ? COLORS.rose : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: active ? COLORS.rose : theme.colors.text,
                        fontFamily: active ? FONTS.body.bold : FONTS.body.medium,
                      },
                    ]}
                  >
                    {s.label}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.rose} />
                  ) : (
                    <View style={{ width: 16 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Price range */}
          <Text style={[styles.sectionLabel, { color: theme.colors.text, marginTop: 20 }]}>
            Price range
          </Text>
          <View style={styles.priceRow}>
            <View
              style={[
                styles.priceBox,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Min</Text>
              <TextInput
                value={minText}
                onChangeText={setMinText}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                style={[
                  styles.priceInput,
                  { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
                ]}
              />
            </View>
            <View style={[styles.priceDivider, { backgroundColor: theme.colors.border }]} />
            <View
              style={[
                styles.priceBox,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Max</Text>
              <TextInput
                value={maxText}
                onChangeText={setMaxText}
                placeholder="Any"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                style={[
                  styles.priceInput,
                  { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
                ]}
              />
            </View>
          </View>
          {(minText || maxText) && (
            <Text style={[styles.priceHint, { color: theme.colors.textSecondary }]}>
              {formatCurrency(Number(minText) || 0)} —{' '}
              {maxText ? formatCurrency(Number(maxText)) : 'Any'}
            </Text>
          )}

          {/* Dietary + Stock */}
          <Text style={[styles.sectionLabel, { color: theme.colors.text, marginTop: 20 }]}>
            Refine
          </Text>
          <View style={styles.chipGrid}>
            {DIETARY.map((d) => {
              const active = Boolean(draft[d.key]);
              return (
                <TouchableOpacity
                  key={d.key}
                  activeOpacity={0.85}
                  onPress={() => setDraft((s) => ({ ...s, [d.key]: !s[d.key] }))}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? d.bg : theme.colors.surface,
                      borderColor: active ? d.color + '55' : theme.colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={d.icon}
                    size={14}
                    color={active ? d.color : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: active ? d.color : theme.colors.text,
                        fontFamily: active ? FONTS.body.bold : FONTS.body.medium,
                      },
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={handleReset}
            activeOpacity={0.85}
            style={[styles.footerBtn, styles.resetBtn, { borderColor: theme.colors.border }]}
          >
            <Text
              style={[
                styles.resetText,
                { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
              ]}
            >
              Reset
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleApply}
            activeOpacity={0.85}
            style={[styles.footerBtn, { backgroundColor: COLORS.rose }]}
          >
            <Text style={[styles.applyText, { fontFamily: FONTS.body.bold }]}>
              Apply{activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: DRAWER_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18 },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontFamily: FONTS.body.bold },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: FONTS.body.bold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  optionStack: { gap: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionText: { flex: 1, fontSize: 13, letterSpacing: 0.2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  priceDivider: { width: 16, height: 2, borderRadius: 1 },
  priceLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: FONTS.body.medium,
  },
  priceInput: {
    fontSize: 16,
    paddingVertical: 4,
  },
  priceHint: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: FONTS.body.medium,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 12, letterSpacing: 0.2 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  resetText: { fontSize: 13, letterSpacing: 0.2 },
  applyText: { fontSize: 13, color: '#FFFFFF', letterSpacing: 0.3 },
});

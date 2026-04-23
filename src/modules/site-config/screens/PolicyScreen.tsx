import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import RenderHTML from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { FONTS } from '../../../config/fonts';
import { Skeleton } from '../../../components/ui/Skeleton';
import {
  useTermsAndConditions,
  usePrivacyPolicy,
  useRefundPolicy,
  useShippingPolicy,
  siteConfigKeys,
} from '../hooks';
import { PolicyValue } from '../api';

type PolicyType = 'terms' | 'privacy-policy' | 'refund-policy' | 'shipping-policy';

type PolicyRouteParams = {
  Policy: { type: PolicyType };
};

const policyMeta: Record<
  PolicyType,
  {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    accentColor: string;
    configKey: string;
  }
> = {
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'Please read these terms carefully before using our services',
    icon: 'document-text-outline',
    accentColor: '#5C6B3C',
    configKey: 'terms',
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your personal information',
    icon: 'shield-checkmark-outline',
    accentColor: '#E8567F',
    configKey: 'privacy',
  },
  'refund-policy': {
    title: 'Refund Policy',
    subtitle: 'Our hassle-free return and refund process',
    icon: 'refresh-outline',
    accentColor: '#B59F6B',
    configKey: 'refund',
  },
  'shipping-policy': {
    title: 'Shipping Policy',
    subtitle: 'Delivery timelines, charges, and tracking information',
    icon: 'car-outline',
    accentColor: '#3B82F6',
    configKey: 'shipping',
  },
};

function useHookForType(type: PolicyType) {
  const terms = useTermsAndConditions();
  const privacy = usePrivacyPolicy();
  const refund = useRefundPolicy();
  const shipping = useShippingPolicy();

  switch (type) {
    case 'terms':
      return terms;
    case 'privacy-policy':
      return privacy;
    case 'refund-policy':
      return refund;
    case 'shipping-policy':
      return shipping;
  }
}

function looksLikeHtml(s: string) {
  return /<[a-z][\s\S]*>/i.test(s);
}

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PolicyScreen() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const route = useRoute<RouteProp<PolicyRouteParams, 'Policy'>>();
  const policyType = route.params.type;
  const meta = policyMeta[policyType];
  const queryClient = useQueryClient();

  const query = useHookForType(policyType);
  const { data: configRes, isLoading, isError, isRefetching, refetch } = query;

  const value: PolicyValue | null = configRes?.data?.value ?? null;
  const title = value?.title || meta.title;
  const lastUpdated = formatDate(value?.lastUpdated);
  const content = value?.content ?? '';

  const htmlBaseStyle = useMemo(
    () => ({
      color: theme.colors.text,
      fontFamily: FONTS.body.regular,
      fontSize: 14,
      lineHeight: 24,
    }),
    [theme.colors.text],
  );

  const tagsStyles = useMemo(
    () => ({
      h1: { fontFamily: FONTS.heading.bold, fontSize: 20, marginBottom: 8 },
      h2: { fontFamily: FONTS.heading.bold, fontSize: 18, marginBottom: 6, marginTop: 14 },
      h3: { fontFamily: FONTS.body.bold, fontSize: 16, marginBottom: 4, marginTop: 10 },
      p: { marginBottom: 10 },
      li: { marginBottom: 4 },
      a: { color: meta.accentColor, textDecorationLine: 'underline' as const },
      strong: { fontFamily: FONTS.body.bold },
      b: { fontFamily: FONTS.body.bold },
    }),
    [meta.accentColor],
  );

  const hasContent = content.trim().length > 0;
  const renderContent = () => {
    if (isLoading) return renderSkeleton();
    if (isError) return renderError();
    if (!hasContent) return renderEmpty();
    return (
      <View
        style={[
          styles.contentCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        {looksLikeHtml(content) ? (
          <RenderHTML
            contentWidth={width - 72}
            source={{ html: content }}
            baseStyle={htmlBaseStyle}
            tagsStyles={tagsStyles}
          />
        ) : (
          <Text style={[styles.contentText, { color: theme.colors.text }]}>{content}</Text>
        )}
      </View>
    );
  };

  const renderSkeleton = () => (
    <View
      style={[
        styles.contentCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonBlock}>
          <Skeleton width="40%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="100%" height={12} style={{ marginBottom: 6 }} />
          <Skeleton width="95%" height={12} style={{ marginBottom: 6 }} />
          <Skeleton width="70%" height={12} />
        </View>
      ))}
    </View>
  );

  const renderError = () => (
    <View
      style={[
        styles.contentCard,
        styles.stateCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={36} color={theme.colors.textSecondary} />
      <Text style={[styles.stateTitle, { color: theme.colors.text }]}>
        Couldn&apos;t load this policy
      </Text>
      <Text style={[styles.stateBody, { color: theme.colors.textSecondary }]}>
        Please check your connection and try again.
      </Text>
      <TouchableOpacity
        style={[styles.retryBtn, { backgroundColor: meta.accentColor }]}
        onPress={() => {
          queryClient.invalidateQueries({ queryKey: siteConfigKeys.config(meta.configKey) });
          refetch();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.retryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View
      style={[
        styles.contentCard,
        styles.stateCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Ionicons name="document-outline" size={36} color={theme.colors.textSecondary} />
      <Text style={[styles.stateTitle, { color: theme.colors.text }]}>
        This policy isn&apos;t published yet
      </Text>
      <Text style={[styles.stateBody, { color: theme.colors.textSecondary }]}>
        Please check back soon or reach out to support.
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={meta.accentColor}
        />
      }
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={[styles.headerAccent, { backgroundColor: meta.accentColor + '20' }]}>
          <View style={[styles.accentLine, { backgroundColor: meta.accentColor }]} />
          <Text style={[styles.headerTag, { color: meta.accentColor }]}>Legal</Text>
        </View>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {meta.subtitle}
        </Text>
      </View>

      <View style={styles.contentContainer}>
        {renderContent()}
        {lastUpdated ? (
          <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
            Last updated: {lastUpdated}
          </Text>
        ) : null}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    backgroundColor: '#FFF8F0',
  },
  headerAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  accentLine: { width: 16, height: 2, borderRadius: 1 },
  headerTag: {
    fontFamily: FONTS.body.bold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: FONTS.heading.bold,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 6,
  },
  headerSubtitle: { fontFamily: FONTS.body.regular, fontSize: 14, lineHeight: 20 },
  contentContainer: { padding: 16 },
  contentCard: { borderRadius: 16, borderWidth: 1, padding: 20 },
  contentText: {
    fontFamily: FONTS.body.regular,
    fontSize: 14,
    lineHeight: 24,
  },
  skeletonBlock: { marginBottom: 18 },
  stateCard: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  stateTitle: { fontFamily: FONTS.body.bold, fontSize: 15, textAlign: 'center' },
  stateBody: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 8,
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
  lastUpdated: {
    fontFamily: FONTS.body.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});

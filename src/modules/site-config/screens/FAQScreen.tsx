import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { FONTS } from '../../../config/fonts';
import { useFAQs } from '../hooks';
import { FAQItem } from '../api';

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'Are all your products 100% natural with no additives?',
    answer:
      'Yes, every product we sell is free from artificial colours, flavours, preservatives, and fillers. We source directly from farms and small-batch processors who share our no-compromise philosophy.',
    category: 'Products',
    sortOrder: 1,
  },
  {
    id: '2',
    question: 'How do you ensure freshness across all products?',
    answer:
      'We operate on a tight rotation \u2014 products are replenished in small batches weekly. Whole spices are vacuum-sealed within 48 hours of packing. Dry fruits are stored in climate-controlled facilities to preserve texture and nutrition.',
    category: 'Products',
    sortOrder: 2,
  },
  {
    id: '3',
    question: 'Do you offer organic-certified variants?',
    answer:
      'Yes. Our Organic Range carries full FSSAI organic certification. These are grown without synthetic pesticides, fertilisers, or GMOs \u2014 verified at the source.',
    category: 'Products',
    sortOrder: 3,
  },
  {
    id: '4',
    question: 'What is the delivery timeframe and cost?',
    answer:
      'Standard delivery takes 2-5 business days across India. Orders above \u20B9499 ship free. For orders below \u20B9499, a flat \u20B949 fee applies. Metro cities typically receive orders within 2 days.',
    category: 'Shipping',
    sortOrder: 1,
  },
  {
    id: '5',
    question: 'Do you ship to all pin codes in India?',
    answer:
      'We cover 19,000+ pin codes through our logistics partners. You can check your pin code eligibility at checkout before placing an order.',
    category: 'Shipping',
    sortOrder: 2,
  },
  {
    id: '6',
    question: 'Can I track my order in real time?',
    answer:
      'Yes. Once dispatched you will receive an SMS and email with a tracking link. You can also track directly from the My Orders section of your account at any time.',
    category: 'Shipping',
    sortOrder: 3,
  },
  {
    id: '7',
    question: 'What is your return and refund policy?',
    answer:
      'We offer a no-questions-asked 7-day return window from the date of delivery. If you are unsatisfied for any reason, reach out and we will arrange a pickup and full refund within 3-5 business days.',
    category: 'Returns',
    sortOrder: 1,
  },
  {
    id: '8',
    question: 'What if my product arrives damaged or tampered?',
    answer:
      'Report it within 48 hours with a photo and we will send a replacement at no cost, typically within 2 days.',
    category: 'Returns',
    sortOrder: 2,
  },
  {
    id: '9',
    question: 'How can I contact customer support?',
    answer:
      'You can reach us via email at support@lotusmart.in, call us at +91-9876543210, or use the WhatsApp chat on our website. Our support team is available Monday to Saturday, 9 AM to 7 PM.',
    category: 'General',
    sortOrder: 1,
  },
  {
    id: '10',
    question: 'Do you offer bulk or corporate orders?',
    answer:
      'Absolutely. We offer custom pricing for bulk orders and corporate gifting. Reach out to us via the Contact page or email us directly for a personalized quote.',
    category: 'General',
    sortOrder: 2,
  },
];

const CATEGORIES = ['All', 'Products', 'Shipping', 'Returns', 'General'];

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  Products: { color: '#5C6B3C', bg: '#E8EDDD' },
  Shipping: { color: '#B59F6B', bg: '#F5F0E1' },
  Returns: { color: '#E8567F', bg: '#FFF1F3' },
  General: { color: '#3B82F6', bg: '#EFF6FF' },
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Products: 'leaf-outline',
  Shipping: 'car-outline',
  Returns: 'shield-checkmark-outline',
  General: 'help-circle-outline',
};

export default function FAQScreen() {
  const { theme } = useTheme();
  const { data: faqRes, isLoading } = useFAQs();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqs: FAQItem[] = useMemo(() => {
    const items = faqRes?.data?.value?.items;
    if (Array.isArray(items) && items.length > 0) return items;
    return DEFAULT_FAQS;
  }, [faqRes]);

  const filteredFAQs = useMemo(() => {
    let result = [...faqs];
    if (activeCategory !== 'All') {
      result = result.filter((f) => f.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q),
      );
    }
    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [faqs, activeCategory, search]);

  const getCategoryStyle = (cat: string) =>
    CATEGORY_COLORS[cat] ?? { color: '#E8567F', bg: '#FFF1F3' };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primaryLight }]}>
        <Text style={[styles.headerTag, { color: theme.colors.accent }]}>Help Center</Text>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Frequently Asked{' '}
          <Text style={{ color: theme.colors.primary }}>Questions</Text>
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          Everything you need to know about LotusMart
        </Text>
      </View>

      <View style={styles.content}>
        {/* Search */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text, fontSize: theme.fontSizes.sm }]}
            placeholder="Search FAQs..."
            placeholderTextColor={theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: theme.colors.primary, fontFamily: FONTS.body.semiBold, fontSize: 12 }}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const catStyle = cat !== 'All' ? getCategoryStyle(cat) : null;
            const icon = CATEGORY_ICONS[cat];
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isActive
                      ? catStyle?.bg ?? theme.colors.primaryLight
                      : theme.colors.surface,
                    borderColor: isActive
                      ? catStyle?.color ?? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => {
                  setActiveCategory(cat);
                  setExpandedId(null);
                }}
                activeOpacity={0.7}
              >
                {icon && (
                  <Ionicons
                    name={icon}
                    size={14}
                    color={isActive ? catStyle?.color ?? theme.colors.primary : theme.colors.textSecondary}
                  />
                )}
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isActive
                        ? catStyle?.color ?? theme.colors.primary
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {cat}
                </Text>
                {isActive && (
                  <View style={[styles.categoryCount, { backgroundColor: catStyle?.color ?? theme.colors.primary }]}>
                    <Text style={styles.categoryCountText}>{filteredFAQs.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FAQ List */}
        {filteredFAQs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={36} color={theme.colors.border} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No FAQs found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Try a different search term or category
            </Text>
          </View>
        ) : (
          <View style={[styles.faqList, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {filteredFAQs.map((faq, index) => {
              const isOpen = expandedId === faq.id;
              const catStyle = getCategoryStyle(faq.category);
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={[
                    styles.faqItem,
                    index < filteredFAQs.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setExpandedId(isOpen ? null : faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.questionRow}>
                    <Text
                      style={[
                        styles.question,
                        { color: isOpen ? theme.colors.text : theme.colors.textSecondary },
                      ]}
                    >
                      {faq.question}
                    </Text>
                    <View
                      style={[
                        styles.toggleIcon,
                        {
                          backgroundColor: isOpen ? catStyle.color : theme.colors.background,
                          borderColor: isOpen ? catStyle.color : theme.colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isOpen ? 'remove' : 'add'}
                        size={14}
                        color={isOpen ? '#FFFFFF' : theme.colors.textSecondary}
                      />
                    </View>
                  </View>
                  {isOpen && (
                    <View style={styles.answerContainer}>
                      <View style={[styles.answerBar, { backgroundColor: catStyle.color }]} />
                      <Text style={[styles.answer, { color: theme.colors.textSecondary }]}>
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Still have questions */}
        <View style={[styles.contactCard, { backgroundColor: '#FFF1F3', borderColor: '#FECDD3' }]}>
          <Ionicons name="help-circle-outline" size={32} color="#E8567F" />
          <Text style={[styles.contactTitle, { color: theme.colors.text }]}>
            Still have questions?
          </Text>
          <Text style={[styles.contactSubtitle, { color: theme.colors.textSecondary }]}>
            Our support team is available Monday to Saturday, 9 AM to 7 PM. We are always happy to help.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTag: {
    fontFamily: FONTS.body.bold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: FONTS.heading.bold,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body.regular,
    padding: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  categoryText: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 12,
  },
  categoryCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryCountText: {
    fontFamily: FONTS.body.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 15,
  },
  emptySubtitle: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
  },
  faqList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  question: {
    flex: 1,
    fontFamily: FONTS.body.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  toggleIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  answerContainer: {
    marginTop: 12,
    paddingTop: 12,
  },
  answerBar: {
    width: 28,
    height: 2,
    borderRadius: 1,
    marginBottom: 10,
    opacity: 0.4,
  },
  answer: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    lineHeight: 22,
  },
  contactCard: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  contactTitle: {
    fontFamily: FONTS.body.bold,
    fontSize: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  contactSubtitle: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});

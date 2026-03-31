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

const CATEGORIES = ['All', 'Products', 'Shipping', 'Returns', 'General'];

const categoryColors: Record<string, { color: string; light: string }> = {
  Products: { color: '#5C6B3C', light: '#E8EDDD' },
  Shipping: { color: '#B59F6B', light: '#F5F0E1' },
  Returns: { color: '#E8567F', light: '#FFF1F3' },
  General: { color: '#3B82F6', light: '#EFF6FF' },
};

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Products: 'leaf-outline',
  Shipping: 'car-outline',
  Returns: 'shield-checkmark-outline',
  General: 'help-circle-outline',
};

const defaultFAQs: FAQItem[] = [
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
      'You can reach us via email at support@lotusmart.in, call us at +91-9876543210, or use the WhatsApp chat. Our support team is available Monday to Saturday, 9 AM to 7 PM.',
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

export default function FAQScreen() {
  const { theme } = useTheme();
  const { data: faqRes, isLoading } = useFAQs();

  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqs: FAQItem[] = useMemo(() => {
    const items = faqRes?.data?.value?.items;
    return Array.isArray(items) && items.length > 0 ? items : defaultFAQs;
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

  const getColor = (category: string) =>
    categoryColors[category] ?? categoryColors.General;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#FFF8F0' }]}>
        <Text style={[styles.headerTag, { color: '#B59F6B' }]}>Help Center</Text>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Frequently Asked{' '}
          <Text style={{ color: '#E8567F' }}>Questions</Text>
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          Everything you need to know about LotusMart
        </Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* Search */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search FAQs..."
            placeholderTextColor={theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={[styles.clearText, { color: '#E8567F' }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesRow}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const colors = cat !== 'All' ? getColor(cat) : { color: '#E8567F', light: '#FFF1F3' };
            const icon = categoryIcons[cat];

            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? colors.light : '#F7F6F0',
                    borderColor: isActive ? colors.color + '40' : theme.colors.border,
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
                    color={isActive ? colors.color : theme.colors.textSecondary}
                  />
                )}
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: isActive ? colors.color : theme.colors.textSecondary },
                  ]}
                >
                  {cat}
                </Text>
                {isActive && (
                  <View style={[styles.countBadge, { backgroundColor: colors.color }]}>
                    <Text style={styles.countBadgeText}>{filteredFAQs.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FAQ List */}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : filteredFAQs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={36} color={theme.colors.border} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No FAQs found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Try a different search term or category
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.faqList,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {filteredFAQs.map((faq, index) => {
              const isOpen = expandedId === faq.id;
              const colors = getColor(faq.category);

              return (
                <TouchableOpacity
                  key={faq.id}
                  onPress={() => setExpandedId(isOpen ? null : faq.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.faqItem,
                    index < filteredFAQs.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
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
                          backgroundColor: isOpen ? colors.color : '#F7F6F0',
                          borderColor: isOpen ? 'transparent' : theme.colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isOpen ? 'remove' : 'add'}
                        size={14}
                        color={isOpen ? '#FFFFFF' : '#B8AE86'}
                      />
                    </View>
                  </View>
                  {isOpen && (
                    <View style={[styles.answerContainer, { borderTopColor: theme.colors.border }]}>
                      <View
                        style={[styles.answerAccent, { backgroundColor: colors.color + '60' }]}
                      />
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

        {/* Contact CTA */}
        <View style={[styles.contactCTA, { backgroundColor: '#FFF1F3', borderColor: '#FECDD3' }]}>
          <Ionicons name="help-circle-outline" size={32} color="#E8567F" />
          <Text style={[styles.contactTitle, { color: theme.colors.text }]}>
            Still have questions?
          </Text>
          <Text style={[styles.contactSubtitle, { color: theme.colors.textSecondary }]}>
            Our support team is available Monday to Saturday, 9 AM to 7 PM.
          </Text>
          <TouchableOpacity style={styles.contactButton} activeOpacity={0.8}>
            <Text style={styles.contactButtonText}>Contact Us</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE8D8',
  },
  headerTag: {
    fontFamily: FONTS.body.bold,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: FONTS.heading.bold,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontFamily: FONTS.body.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body.regular,
    fontSize: 14,
    padding: 0,
  },
  clearText: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 12,
  },
  categoriesRow: {
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  categoryChipText: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 13,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontFamily: FONTS.body.bold,
    color: '#FFFFFF',
    fontSize: 10,
  },
  faqList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqItem: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  question: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  toggleIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: -2,
  },
  answerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  answerAccent: {
    width: 32,
    height: 2,
    borderRadius: 1,
    marginBottom: 10,
  },
  answer: {
    fontFamily: FONTS.body.medium,
    fontSize: 13,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 16,
  },
  emptySubtitle: {
    fontFamily: FONTS.body.regular,
    fontSize: 13,
  },
  contactCTA: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    marginTop: 24,
    gap: 8,
  },
  contactTitle: {
    fontFamily: FONTS.body.bold,
    fontSize: 18,
  },
  contactSubtitle: {
    fontFamily: FONTS.body.medium,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8567F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  contactButtonText: {
    fontFamily: FONTS.body.semiBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
});

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeContext';
import { FONTS } from '../../../config/fonts';
import {
  useTermsAndConditions,
  usePrivacyPolicy,
  useRefundPolicy,
  useShippingPolicy,
} from '../hooks';

type PolicyType = 'terms' | 'privacy-policy' | 'refund-policy' | 'shipping-policy';

type PolicyRouteParams = {
  Policy: { type: PolicyType };
};

const policyMeta: Record<
  PolicyType,
  { title: string; subtitle: string; icon: string; accentColor: string }
> = {
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'Please read these terms carefully before using our services',
    icon: 'document-text-outline',
    accentColor: '#5C6B3C',
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your personal information',
    icon: 'shield-checkmark-outline',
    accentColor: '#E8567F',
  },
  'refund-policy': {
    title: 'Refund Policy',
    subtitle: 'Our hassle-free return and refund process',
    icon: 'refresh-outline',
    accentColor: '#B59F6B',
  },
  'shipping-policy': {
    title: 'Shipping Policy',
    subtitle: 'Delivery timelines, charges, and tracking information',
    icon: 'car-outline',
    accentColor: '#3B82F6',
  },
};

const defaultContent: Record<PolicyType, string> = {
  terms: `Welcome to LotusMart. By accessing or using our website and mobile application, you agree to be bound by these Terms & Conditions.

1. ACCEPTANCE OF TERMS
By using our services, you acknowledge that you have read, understood, and agree to be bound by these terms. If you do not agree, please do not use our services.

2. PRODUCTS AND PRICING
All products listed on LotusMart are subject to availability. Prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise. We reserve the right to modify prices without prior notice.

3. ORDERING AND PAYMENT
Orders placed through our platform are subject to acceptance. We accept payments via UPI, credit/debit cards, net banking, wallets, and Cash on Delivery (COD). Payment processing is handled securely through Razorpay.

4. SHIPPING AND DELIVERY
We deliver across India. Standard delivery takes 2-5 business days. Orders above \u20B9499 qualify for free shipping. For details, please refer to our Shipping Policy.

5. RETURNS AND REFUNDS
We offer a 7-day return window from the date of delivery. For complete details, please refer to our Refund Policy.

6. USER ACCOUNTS
You are responsible for maintaining the confidentiality of your account credentials. All activities under your account are your responsibility.

7. INTELLECTUAL PROPERTY
All content on LotusMart, including text, images, logos, and designs, is our intellectual property and may not be reproduced without written consent.

8. LIMITATION OF LIABILITY
LotusMart shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.

9. CHANGES TO TERMS
We may update these terms from time to time. Continued use of our services constitutes acceptance of the updated terms.

10. CONTACT US
For questions about these Terms & Conditions, please contact us at support@lotusmart.in.`,
  'privacy-policy': `LotusMart is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.

1. INFORMATION WE COLLECT
\u2022 Personal Information: Name, email address, phone number, shipping address
\u2022 Payment Information: Processed securely through Razorpay (we do not store card details)
\u2022 Usage Data: Browsing patterns, device information, IP address
\u2022 Order History: Purchase records for order management

2. HOW WE USE YOUR INFORMATION
\u2022 Process and fulfill orders
\u2022 Send order updates and tracking information
\u2022 Improve our products and services
\u2022 Send promotional communications (with your consent)
\u2022 Prevent fraud and ensure security

3. DATA SHARING
We do not sell your personal information. We share data only with:
\u2022 Payment processors (Razorpay)
\u2022 Shipping partners (for delivery)
\u2022 Legal authorities (when required by law)

4. DATA SECURITY
We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your data.

5. COOKIES
Our website uses cookies to enhance your browsing experience. You can manage cookie preferences through your browser settings.

6. YOUR RIGHTS
You have the right to:
\u2022 Access your personal data
\u2022 Request data correction or deletion
\u2022 Opt out of marketing communications
\u2022 Request data portability

7. CHANGES TO POLICY
We may update this policy periodically. We will notify you of significant changes via email or app notification.

8. CONTACT US
For privacy-related inquiries, email us at support@lotusmart.in.`,
  'refund-policy': `At LotusMart, your satisfaction is our priority. We offer a hassle-free return and refund process.

1. RETURN WINDOW
You may return products within 7 days of delivery. The return window starts from the date the order is marked as delivered.

2. ELIGIBLE RETURNS
\u2022 Products received in damaged condition
\u2022 Wrong products delivered
\u2022 Products with quality issues
\u2022 Products significantly different from description

3. NON-RETURNABLE ITEMS
\u2022 Opened food items (for hygiene reasons)
\u2022 Products with broken seals (unless damaged in transit)
\u2022 Gift cards and promotional items

4. RETURN PROCESS
1. Contact us within 7 days of delivery
2. Share photos of the product/packaging
3. We will arrange a pickup at no cost
4. Refund will be processed within 3-5 business days

5. REFUND METHODS
\u2022 Original payment method: 3-5 business days
\u2022 Bank account: 5-7 business days
\u2022 Store credit: Instant

6. EXCHANGE
We offer free exchanges for damaged or wrong products. The replacement will be shipped within 2 business days of receiving the returned item.

7. CANCELLATION
Orders can be cancelled before dispatch. Once shipped, the order must follow the return process.

8. CONTACT US
For return or refund queries, reach us at support@lotusmart.in or call +91-9876543210.`,
  'shipping-policy': `LotusMart delivers across India with reliable shipping partners to ensure your products reach you fresh and on time.

1. DELIVERY COVERAGE
We deliver to 19,000+ pin codes across India. Check pin code eligibility at checkout.

2. SHIPPING CHARGES
\u2022 Orders above \u20B9499: FREE shipping
\u2022 Orders below \u20B9499: Flat \u20B949-60 shipping fee
\u2022 Express delivery (select cities): Additional charges apply

3. DELIVERY TIMELINES
\u2022 Metro cities: 2-3 business days
\u2022 Tier 2 cities: 3-5 business days
\u2022 Remote areas: 5-7 business days

4. ORDER PROCESSING
\u2022 Orders placed before 2 PM are processed the same day
\u2022 Orders placed after 2 PM are processed the next business day
\u2022 We do not process orders on Sundays and national holidays

5. TRACKING YOUR ORDER
Once your order is dispatched:
\u2022 You will receive an SMS and email with tracking details
\u2022 Track your order from the "My Orders" section
\u2022 Real-time tracking available through our shipping partners

6. PACKAGING
All products are packed in premium food-grade, airtight packaging to ensure maximum freshness. Fragile items receive additional protective packaging.

7. FAILED DELIVERY
If delivery fails due to incorrect address or unavailability:
\u2022 Our shipping partner will attempt 2 additional deliveries
\u2022 After 3 failed attempts, the order will be returned to us
\u2022 A full refund will be processed for prepaid orders

8. CONTACT US
For shipping-related queries, email support@lotusmart.in or call +91-9876543210.`,
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

export default function PolicyScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<PolicyRouteParams, 'Policy'>>();
  const policyType = route.params.type;
  const meta = policyMeta[policyType];

  const { data: configRes, isLoading } = useHookForType(policyType);

  const content: string =
    configRes?.data?.value?.content ?? defaultContent[policyType];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={[styles.headerAccent, { backgroundColor: meta.accentColor + '20' }]}>
          <View style={[styles.accentLine, { backgroundColor: meta.accentColor }]} />
          <Text style={[styles.headerTag, { color: meta.accentColor }]}>Legal</Text>
        </View>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {meta.title}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {meta.subtitle}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <View
            style={[
              styles.contentCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.contentText, { color: theme.colors.text }]}>
              {content}
            </Text>
          </View>
        )}

        <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
          Last updated: March 2026
        </Text>
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
  accentLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
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
  headerSubtitle: {
    fontFamily: FONTS.body.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  contentContainer: {
    padding: 16,
  },
  contentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  contentText: {
    fontFamily: FONTS.body.regular,
    fontSize: 14,
    lineHeight: 24,
  },
  lastUpdated: {
    fontFamily: FONTS.body.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});

export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://lotusmart.in/api';

export const COLORS = {
  cream: '#FFF8F0',
  creamDark: '#1A1A1A',
  rose: '#E84672',
  roseDark: '#C93D63',
  roseLight: '#FDEEF2',
  olive: '#5C6B3C',
  oliveDark: '#3E4A28',
  oliveLight: '#E8EDDD',
  gold: '#B59F6B',
  goldDark: '#8C7A4F',
  goldLight: '#F5F0E1',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textPrimaryDark: '#F9FAFB',
  textSecondaryDark: '#9CA3AF',
  background: '#FFFDF7',
  backgroundDark: '#111111',
  surface: '#FFFFFF',
  surfaceDark: '#1E1E1E',
  border: '#E5E7EB',
  borderDark: '#374151',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const FREE_SHIPPING_THRESHOLD = 499;
export const DEFAULT_SHIPPING_COST = 60;

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const;

export const PAYMENT_METHODS = ['cod', 'razorpay'] as const;

export const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

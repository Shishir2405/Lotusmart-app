import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../../components/ui';
import { useAuthStore } from '../../../store/auth.store';
import { useLogout } from '../../auth/hooks';
import { ProfileStackParamList } from '../types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  color?: string;
  bgColor?: string;
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<ProfileNavProp>();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logoutMutation.mutate() },
    ]);
  }, [logoutMutation]);

  const handleLogin = useCallback(() => {
    (navigation as NativeStackNavigationProp<Record<string, object | undefined>>).navigate('Auth', {
      screen: 'Login',
    });
  }, [navigation]);

  const handleRegister = useCallback(() => {
    (navigation as NativeStackNavigationProp<Record<string, object | undefined>>).navigate('Auth', {
      screen: 'Register',
    });
  }, [navigation]);

  const getInitials = (name: string): string =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleNavigatePolicy = useCallback(
    (type: 'terms' | 'privacy-policy' | 'refund-policy' | 'shipping-policy') => {
      (navigation as NativeStackNavigationProp<Record<string, object | undefined>>).navigate(
        'Policy',
        { type },
      );
    },
    [navigation],
  );

  const menuItems: MenuItem[] = user
    ? [
        {
          icon: 'cube-outline',
          label: 'My Orders',
          bgColor: COLORS.roseLight,
          color: COLORS.rose,
          onPress: () =>
            (navigation as NativeStackNavigationProp<Record<string, object | undefined>>).navigate(
              'Main',
              { screen: 'OrdersTab' },
            ),
        },
        {
          icon: 'location-outline',
          label: 'My Addresses',
          bgColor: COLORS.oliveLight,
          color: COLORS.olive,
          onPress: () => navigation.navigate('Addresses'),
        },
        {
          icon: 'heart-outline',
          label: 'My Wishlist',
          bgColor: '#FEF3C7',
          color: '#F59E0B',
          onPress: () =>
            (navigation as NativeStackNavigationProp<Record<string, object | undefined>>).navigate(
              'Main',
              { screen: 'HomeTab' },
            ),
        },
        {
          icon: 'lock-closed-outline',
          label: 'Change Password',
          bgColor: '#EDE9FE',
          color: '#8B5CF6',
          onPress: () => navigation.navigate('ChangePassword'),
        },
      ]
    : [];

  const infoItems: MenuItem[] = [
    {
      icon: 'help-circle-outline',
      label: 'FAQs',
      bgColor: COLORS.goldLight,
      color: COLORS.gold,
      onPress: () =>
        (navigation as NativeStackNavigationProp<Record<string, object | undefined>>).navigate(
          'FAQ',
        ),
    },
    {
      icon: 'mail-outline',
      label: 'Contact Us',
      bgColor: COLORS.roseLight,
      color: COLORS.rose,
      onPress: () =>
        (navigation as NativeStackNavigationProp<Record<string, object | undefined>>).navigate(
          'Contact',
        ),
    },
    {
      icon: 'document-text-outline',
      label: 'Terms & Conditions',
      bgColor: '#F0F9FF',
      color: '#0EA5E9',
      onPress: () => handleNavigatePolicy('terms'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Privacy Policy',
      bgColor: '#ECFDF5',
      color: '#10B981',
      onPress: () => handleNavigatePolicy('privacy-policy'),
    },
    {
      icon: 'refresh-outline',
      label: 'Refund Policy',
      bgColor: '#FFF7ED',
      color: '#F97316',
      onPress: () => handleNavigatePolicy('refund-policy'),
    },
    {
      icon: 'car-outline',
      label: 'Shipping Policy',
      bgColor: COLORS.oliveLight,
      color: COLORS.olive,
      onPress: () => handleNavigatePolicy('shipping-policy'),
    },
  ];

  const renderMenuItem = (item: MenuItem, index: number, total: number) => {
    const isLast = index === total - 1;
    return (
      <TouchableOpacity
        key={item.label}
        onPress={item.onPress}
        activeOpacity={0.7}
        style={[
          styles.menuItem,
          !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
        ]}
      >
        <View style={styles.menuItemLeft}>
          <View
            style={[
              styles.menuIconContainer,
              { backgroundColor: item.bgColor || COLORS.rose + '14' },
            ]}
          >
            <Ionicons name={item.icon} size={20} color={item.color || theme.colors.primary} />
          </View>
          <Text
            style={[styles.menuLabel, { color: theme.colors.text, fontFamily: FONTS.body.medium }]}
          >
            {item.label}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.headerSection}>
          <Text
            style={[
              styles.screenTitle,
              { color: theme.colors.text, fontFamily: FONTS.heading.bold },
            ]}
          >
            Profile
          </Text>
        </Animated.View>

        {/* User Info or Auth Prompt */}
        {user ? (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.userSection}>
            <LinearGradient
              colors={[COLORS.rose, COLORS.roseDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </LinearGradient>
            <Text
              style={[
                styles.userName,
                { color: theme.colors.text, fontFamily: FONTS.heading.bold },
              ]}
            >
              {user.name}
            </Text>
            <Text
              style={[
                styles.userEmail,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              {user.email}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.authPromptSection}
          >
            <View style={[styles.guestAvatar, { backgroundColor: theme.colors.border + '40' }]}>
              <Ionicons name="person-outline" size={36} color={theme.colors.textSecondary} />
            </View>
            <Text
              style={[
                styles.authPromptTitle,
                { color: theme.colors.text, fontFamily: FONTS.heading.bold },
              ]}
            >
              Welcome to LotusMart
            </Text>
            <Text
              style={[
                styles.authPromptSubtitle,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              Sign in to access your orders, wishlist, and more
            </Text>
            <View style={styles.authButtons}>
              <View style={{ flex: 1 }}>
                <Button size="lg" fullWidth onPress={handleLogin}>
                  Login
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button size="lg" fullWidth variant="outline" onPress={handleRegister}>
                  Register
                </Button>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Account Menu */}
        {menuItems.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View
              style={[
                styles.menuContainer,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              {menuItems.map((item, index) => renderMenuItem(item, index, menuItems.length))}
            </View>
          </Animated.View>
        )}

        {/* Logout */}
        {user && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              style={[styles.logoutBtn, { borderColor: theme.colors.error + '30' }]}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
              <Text
                style={[
                  styles.logoutText,
                  { color: theme.colors.error, fontFamily: FONTS.body.semiBold },
                ]}
              >
                Logout
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Info & Support */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.semiBold },
            ]}
          >
            INFORMATION & SUPPORT
          </Text>
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            {infoItems.map((item, index) => renderMenuItem(item, index, infoItems.length))}
          </View>
        </Animated.View>

        {/* Version */}
        <Text
          style={[
            styles.version,
            { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
          ]}
        >
          LotusMart v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  headerSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  screenTitle: { fontSize: 28 },
  userSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { fontSize: 28, fontFamily: FONTS.heading.bold, color: '#FFFFFF' },
  userName: { fontSize: 20, marginBottom: 4 },
  userEmail: { fontSize: 14 },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authPromptSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  authPromptTitle: { fontSize: 20, marginBottom: 4 },
  authPromptSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  authButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  menuContainer: { marginHorizontal: 16, borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: { fontSize: 15 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  logoutText: { fontSize: 15 },
  version: { textAlign: 'center', marginTop: 32, fontSize: 12 },
});

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../../components/ui';
import { useAuthStore } from '../../../store/auth.store';
import { useLogout } from '../../auth/hooks';
import { ProfileStackParamList } from '../types';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  color?: string;
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<ProfileNavProp>();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logoutMutation.mutate(),
        },
      ],
    );
  }, [logoutMutation]);

  const handleNavigateOrders = useCallback(() => {
    (navigation as any).navigate('Orders', { screen: 'OrderList' });
  }, [navigation]);

  const handleNavigateAddresses = useCallback(() => {
    navigation.navigate('Addresses');
  }, [navigation]);

  const handleNavigateWishlist = useCallback(() => {
    (navigation as any).navigate('Wishlist', { screen: 'Wishlist' });
  }, [navigation]);

  const handleNavigateChangePassword = useCallback(() => {
    navigation.navigate('ChangePassword');
  }, [navigation]);

  const handleLogin = useCallback(() => {
    (navigation as any).navigate('Auth', { screen: 'Login' });
  }, [navigation]);

  const handleRegister = useCallback(() => {
    (navigation as any).navigate('Auth', { screen: 'Register' });
  }, [navigation]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNavigateFAQ = useCallback(() => {
    (navigation as any).navigate('FAQ');
  }, [navigation]);

  const handleNavigatePolicy = useCallback(
    (type: 'terms' | 'privacy-policy' | 'refund-policy' | 'shipping-policy') => {
      (navigation as any).navigate('Policy', { type });
    },
    [navigation],
  );

  const menuItems: MenuItem[] = user
    ? [
        {
          icon: 'cube-outline',
          label: 'My Orders',
          onPress: handleNavigateOrders,
        },
        {
          icon: 'location-outline',
          label: 'My Addresses',
          onPress: handleNavigateAddresses,
        },
        {
          icon: 'heart-outline',
          label: 'My Wishlist',
          onPress: handleNavigateWishlist,
        },
        {
          icon: 'lock-closed-outline',
          label: 'Change Password',
          onPress: handleNavigateChangePassword,
        },
        {
          icon: 'log-out-outline',
          label: 'Logout',
          onPress: handleLogout,
          color: theme.colors.error,
        },
      ]
    : [];

  const infoItems: MenuItem[] = [
    {
      icon: 'help-circle-outline',
      label: 'FAQs',
      onPress: handleNavigateFAQ,
    },
    {
      icon: 'document-text-outline',
      label: 'Terms & Conditions',
      onPress: () => handleNavigatePolicy('terms'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Privacy Policy',
      onPress: () => handleNavigatePolicy('privacy-policy'),
    },
    {
      icon: 'refresh-outline',
      label: 'Refund Policy',
      onPress: () => handleNavigatePolicy('refund-policy'),
    },
    {
      icon: 'car-outline',
      label: 'Shipping Policy',
      onPress: () => handleNavigatePolicy('shipping-policy'),
    },
  ];

  const renderMenuItem = (item: MenuItem, index: number) => {
    const isLast = index === menuItems.length - 1;
    const iconColor = item.color ?? theme.colors.textSecondary;
    const labelColor = item.color ?? theme.colors.text;

    return (
      <TouchableOpacity
        key={item.label}
        onPress={item.isToggle ? undefined : item.onPress}
        activeOpacity={item.isToggle ? 1 : 0.7}
        style={[
          styles.menuItem,
          !isLast && {
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.menuItemLeft}>
          <View
            style={[
              styles.menuIconContainer,
              { backgroundColor: (item.color ?? theme.colors.primary) + '12' },
            ]}
          >
            <Ionicons name={item.icon} size={20} color={iconColor} />
          </View>
          <Text
            style={[
              styles.menuLabel,
              { color: labelColor, fontSize: theme.fontSizes.base },
            ]}
          >
            {item.label}
          </Text>
        </View>

        {item.isToggle ? (
          <Switch
            value={item.toggleValue}
            onValueChange={item.onToggle}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary + '60',
            }}
            thumbColor={
              item.toggleValue ? theme.colors.primary : theme.colors.surface
            }
          />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text
            style={[
              styles.screenTitle,
              { color: theme.colors.text, fontSize: theme.fontSizes['3xl'] },
            ]}
          >
            Profile
          </Text>
        </View>

        {/* User Info or Auth Prompt */}
        {user ? (
          <View style={styles.userSection}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: theme.colors.primary, fontSize: theme.fontSizes['2xl'] },
                ]}
              >
                {getInitials(user.name)}
              </Text>
            </View>
            <Text
              style={[
                styles.userName,
                { color: theme.colors.text, fontSize: theme.fontSizes.xl },
              ]}
            >
              {user.name}
            </Text>
            <Text
              style={[
                styles.userEmail,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSizes.sm,
                },
              ]}
            >
              {user.email}
            </Text>
          </View>
        ) : (
          <View style={styles.authPromptSection}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.border + '40' },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={36}
                color={theme.colors.textSecondary}
              />
            </View>
            <Text
              style={[
                styles.authPromptTitle,
                { color: theme.colors.text, fontSize: theme.fontSizes.lg },
              ]}
            >
              Welcome to LotusMart
            </Text>
            <Text
              style={[
                styles.authPromptSubtitle,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSizes.sm,
                },
              ]}
            >
              Sign in to access your orders, wishlist, and more
            </Text>
            <View style={styles.authButtons}>
              <View style={styles.authButtonWrapper}>
                <Button size="lg" fullWidth onPress={handleLogin}>
                  Login
                </Button>
              </View>
              <View style={styles.authButtonWrapper}>
                <Button
                  size="lg"
                  fullWidth
                  variant="outline"
                  onPress={handleRegister}
                >
                  Register
                </Button>
              </View>
            </View>
          </View>
        )}

        {/* Menu List */}
        {menuItems.length > 0 && (
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
          >
            {menuItems.map(renderMenuItem)}
          </View>
        )}

        {/* Info & Support */}
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs },
          ]}
        >
          INFORMATION & SUPPORT
        </Text>
        <View
          style={[
            styles.menuContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
        >
          {infoItems.map((item, index) => {
            const isLast = index === infoItems.length - 1;
            return (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                activeOpacity={0.7}
                style={[
                  styles.menuItem,
                  !isLast && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: (item.color ?? theme.colors.primary) + '12' },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.color ?? theme.colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      { color: item.color ?? theme.colors.text, fontSize: theme.fontSizes.base },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Version Info */}
        <Text
          style={[
            styles.version,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.fontSizes.xs,
            },
          ]}
        >
          LotusMart v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontWeight: '700',
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontWeight: '700',
  },
  userName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontWeight: '400',
  },
  authPromptSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  authPromptTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  authPromptSubtitle: {
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  authButtonWrapper: {
    flex: 1,
  },
  sectionLabel: {
    fontWeight: '600',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  menuContainer: {
    marginHorizontal: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    marginTop: 32,
    fontWeight: '400',
  },
});

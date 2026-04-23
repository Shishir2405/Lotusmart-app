import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../../modules/products/screens/HomeScreen';
import { ProductListScreen } from '../../modules/products/screens/ProductListScreen';
import CategoriesScreen from '../../modules/products/screens/CategoriesScreen';
import CartScreen from '../../modules/cart/screens/CartScreen';
import OrdersScreen from '../../modules/orders/screens/OrdersScreen';
import ProfileScreen from '../../modules/users/screens/ProfileScreen';
import { useCartStore } from '../../store/cart.store';
import { useAuthStore } from '../../store/auth.store';
import { useTheme } from '../../theme/ThemeContext';
import { MainTabParamList } from './types';
import { FONTS } from '../../config/fonts';
import { COLORS } from '../../config/constants';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ACTIVE_COLOR = COLORS.rose;
const INACTIVE_COLOR = '#a8a29e';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ====== ANIMATED TAB BUTTON ======

function AnimatedTabButton({
  label,
  iconName,
  iconNameFocused,
  isFocused,
  onPress,
  onLongPress,
  badge,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconNameFocused: keyof typeof Ionicons.glyphMap;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  badge?: number;
}) {
  const scale = useSharedValue(1);
  const iconTranslateY = useSharedValue(0);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.7);
  const dotWidth = useSharedValue(isFocused ? 16 : 0);
  const badgeScale = useSharedValue(badge && badge > 0 ? 1 : 0);

  useEffect(() => {
    iconTranslateY.value = withSpring(isFocused ? -2 : 0, { damping: 15, stiffness: 150 });
    labelOpacity.value = withTiming(isFocused ? 1 : 0.7, { duration: 200 });
    dotWidth.value = withSpring(isFocused ? 16 : 0, { damping: 15, stiffness: 150 });
  }, [isFocused, iconTranslateY, labelOpacity, dotWidth]);

  useEffect(() => {
    badgeScale.value = withSpring(badge && badge > 0 ? 1 : 0, { damping: 12, stiffness: 200 });
  }, [badge, badgeScale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconTranslateY.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    width: dotWidth.value,
    opacity: dotWidth.value > 0 ? 1 : 0,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.tabButton, containerStyle]}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={iconStyle}>
        <View>
          <Ionicons
            name={isFocused ? iconNameFocused : iconName}
            size={24}
            color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          {badge !== undefined && (
            <Animated.View style={[styles.badge, badgeStyle]}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>
      <Animated.Text
        style={[styles.tabLabel, { color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR }, labelStyle]}
      >
        {label}
      </Animated.Text>
      <Animated.View style={[styles.activeIndicator, dotStyle]} />
    </AnimatedTouchable>
  );
}

// ====== CUSTOM TAB BAR ======

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const itemCount = useCartStore((s) => s.getItemCount());

  const tabs = [
    { key: 'HomeTab', label: 'Home', icon: 'home-outline' as const, iconFocused: 'home' as const },
    {
      key: 'CategoriesTab',
      label: 'Categories',
      icon: 'grid-outline' as const,
      iconFocused: 'grid' as const,
    },
    {
      key: 'CartTab',
      label: 'Cart',
      icon: 'cart-outline' as const,
      iconFocused: 'cart' as const,
      badge: itemCount,
    },
    {
      key: 'OrdersTab',
      label: 'Orders',
      icon: 'receipt-outline' as const,
      iconFocused: 'receipt' as const,
    },
    {
      key: 'ProfileTab',
      label: 'Profile',
      icon: 'person-outline' as const,
      iconFocused: 'person' as const,
    },
  ];

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.surface,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = tabs[index];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <AnimatedTabButton
            key={route.key}
            label={tab.label}
            iconName={tab.icon}
            iconNameFocused={tab.iconFocused}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            badge={tab.badge}
          />
        );
      })}
    </View>
  );
}

// ====== LOGIN PROMPT ======

function LoginPromptScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: 24,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: theme.colors.primary + '14',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Ionicons name="lock-closed-outline" size={40} color={theme.colors.primary} />
      </View>
      <Text
        style={{
          fontFamily: FONTS.heading.bold,
          fontSize: 22,
          color: theme.colors.text,
          textAlign: 'center',
        }}
      >
        Sign in to continue
      </Text>
      <Text
        style={{
          fontFamily: FONTS.body.regular,
          fontSize: 15,
          color: theme.colors.textSecondary,
          marginTop: 8,
          textAlign: 'center',
          lineHeight: 22,
        }}
      >
        Please login to view your orders and manage your account.
      </Text>
      <TouchableOpacity
        style={{
          marginTop: 24,
          backgroundColor: theme.colors.primary,
          paddingHorizontal: 40,
          paddingVertical: 14,
          borderRadius: 12,
        }}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
      >
        <Text style={{ fontFamily: FONTS.body.semiBold, fontSize: 16, color: '#FFFFFF' }}>
          Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ====== NAVIGATOR ======

export function MainTabNavigator() {
  const user = useAuthStore((state) => state.user);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="CategoriesTab" component={CategoriesScreen} />
      <Tab.Screen name="CartTab" component={CartScreen} />
      <Tab.Screen name="OrdersTab" component={user ? OrdersScreen : LoginPromptScreen} />
      <Tab.Screen name="ProfileTab" component={user ? ProfileScreen : LoginPromptScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  tabLabel: {
    fontFamily: FONTS.body.semiBold,
    fontSize: 10,
    marginTop: 2,
  },
  activeIndicator: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: ACTIVE_COLOR,
    marginTop: 3,
  },
  badge: {
    position: 'absolute',
    right: -10,
    top: -4,
    backgroundColor: ACTIVE_COLOR,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
});

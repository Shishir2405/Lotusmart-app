import React from 'react';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../../modules/products/screens/HomeScreen';
import { ProductListScreen } from '../../modules/products/screens/ProductListScreen';
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

function CartIconWithBadge({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <View>
      <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
        </View>
      )}
    </View>
  );
}

// Placeholder screen for unauthenticated users trying to access orders/profile
function LoginPromptScreen() {
  const { theme } = useTheme();
  const navigation = require('@react-navigation/native').useNavigation();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, padding: 24 }}>
      <Ionicons name="lock-closed-outline" size={64} color={theme.colors.primary} />
      <Text style={{ fontFamily: FONTS.heading.bold, fontSize: 22, color: theme.colors.text, marginTop: 16, textAlign: 'center' }}>
        Sign in to continue
      </Text>
      <Text style={{ fontFamily: FONTS.body.regular, fontSize: 15, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
        Please login to view your orders and manage your account.
      </Text>
      <View style={{ marginTop: 24, width: '100%', alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: FONTS.body.semiBold,
            fontSize: 16,
            color: '#FFFFFF',
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 12,
            overflow: 'hidden',
          }}
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
        >
          Sign In
        </Text>
      </View>
    </View>
  );
}

export function MainTabNavigator() {
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.body.semiBold,
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={ProductListScreen}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ color, size, focused }) => (
            <CartIconWithBadge color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={user ? OrdersScreen : LoginPromptScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={user ? ProfileScreen : LoginPromptScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: ACTIVE_COLOR,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});

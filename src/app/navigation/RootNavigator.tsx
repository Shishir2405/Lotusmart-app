import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/auth.store';
import { useTheme } from '../../theme/ThemeContext';
import { SplashScreen } from '../../components/shared/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { ProductDetailScreen } from '../../modules/products/screens/ProductDetailScreen';
import { ProductListScreen } from '../../modules/products/screens/ProductListScreen';
import { SearchScreen } from '../../modules/products/screens/SearchScreen';
import { CheckoutScreen } from '../../modules/cart/screens/CheckoutScreen';
import OrderDetailScreen from '../../modules/orders/screens/OrderDetailScreen';
import AddressesScreen from '../../modules/users/screens/AddressesScreen';
import ChangePasswordScreen from '../../modules/users/screens/ChangePasswordScreen';
import FAQScreen from '../../modules/site-config/screens/FAQScreen';
import PolicyScreen from '../../modules/site-config/screens/PolicyScreen';
import { RootStackParamList } from './types';
import { FONTS } from '../../config/fonts';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const { theme } = useTheme();

  if (!isHydrated) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: FONTS.body.semiBold,
          fontWeight: '600',
        },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Main tabs are always accessible (anonymous browsing) */}
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />

      {/* Product browsing screens - accessible without login */}
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: 'Product Details',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{
          title: 'Products',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      {/* Auth screens - for login/register */}
      <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />

      {/* Checkout - accessible for both logged in and guest users */}
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: 'Checkout',
          presentation: 'card',
        }}
      />

      {/* Info pages - accessible without login */}
      <Stack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{
          title: 'FAQs',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Policy"
        component={PolicyScreen}
        options={({ route }: any) => ({
          title: route.params?.type === 'terms'
            ? 'Terms & Conditions'
            : route.params?.type === 'privacy-policy'
            ? 'Privacy Policy'
            : route.params?.type === 'refund-policy'
            ? 'Refund Policy'
            : 'Shipping Policy',
          presentation: 'card',
        })}
      />

      {/* Protected screens - require login */}
      {user && (
        <>
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{
              title: 'Order Details',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="Addresses"
            component={AddressesScreen}
            options={{
              title: 'My Addresses',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              title: 'Change Password',
              presentation: 'card',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

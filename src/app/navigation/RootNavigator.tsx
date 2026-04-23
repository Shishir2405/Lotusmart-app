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
import ContactScreen from '../../modules/site-config/screens/ContactScreen';
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
        animationDuration: 250,
        gestureEnabled: true,
      }}
    >
      {/* Main tabs */}
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />

      {/* Product screens */}
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: 'Product Details',
          animation: 'slide_from_right',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{
          title: 'Products',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 200,
          presentation: 'transparentModal',
        }}
      />

      {/* Auth */}
      <Stack.Screen
        name="Auth"
        component={AuthNavigator}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationDuration: 300,
        }}
      />

      {/* Checkout */}
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: 'Checkout',
          animation: 'slide_from_right',
        }}
      />

      {/* Info pages */}
      <Stack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{
          title: 'FAQs',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: 'Contact Us',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Policy"
        component={PolicyScreen}
        options={({ route }: { route: { params?: { type?: string } } }) => ({
          title:
            route.params?.type === 'terms'
              ? 'Terms & Conditions'
              : route.params?.type === 'privacy-policy'
                ? 'Privacy Policy'
                : route.params?.type === 'refund-policy'
                  ? 'Refund Policy'
                  : 'Shipping Policy',
          animation: 'slide_from_right',
        })}
      />

      {/* Protected screens */}
      {user && (
        <>
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{
              title: 'Order Details',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Addresses"
            component={AddressesScreen}
            options={{
              title: 'My Addresses',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              title: 'Change Password',
              animation: 'slide_from_right',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

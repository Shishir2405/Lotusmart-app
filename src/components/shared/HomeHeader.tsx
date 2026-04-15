import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useCartStore } from '../../store/cart.store';
import { useAuthStore } from '../../store/auth.store';
import { FONTS } from '../../config/fonts';
import { COLORS } from '../../config/constants';
import logoImage from '../../../assets/logo.png';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function AnimatedIconButton({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedTouchable
      style={[styles.iconButton, animStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      }}
      activeOpacity={1}
    >
      {children}
    </AnimatedTouchable>
  );
}

export function HomeHeader() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const itemCount = useCartStore((state) => state.getItemCount());
  const user = useAuthStore((state) => state.user);

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: insets.top,
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.container}>
        {/* Logo with image */}
        <View style={styles.logoContainer}>
          <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
          <View style={styles.logoTextContainer}>
            <Text style={[styles.logoLotus, { color: COLORS.rose }]}>Lotus</Text>
            <Text style={[styles.logoMart, { color: theme.colors.text }]}>Mart</Text>
          </View>
        </View>

        {/* Right Icons */}
        <View style={styles.rightIcons}>
          <AnimatedIconButton onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search-outline" size={22} color={theme.colors.text} />
          </AnimatedIconButton>

          <AnimatedIconButton onPress={() => navigation.navigate('Main', { screen: 'CartTab' })}>
            <View>
              <Ionicons name="cart-outline" size={22} color={theme.colors.text} />
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
                </View>
              )}
            </View>
          </AnimatedIconButton>

          <AnimatedIconButton
            onPress={() => {
              if (user) {
                navigation.navigate('Main', { screen: 'ProfileTab' });
              } else {
                navigation.navigate('Auth', { screen: 'Login' });
              }
            }}
          >
            <Ionicons
              name={user ? 'person' : 'person-outline'}
              size={22}
              color={user ? COLORS.rose : theme.colors.text}
            />
          </AnimatedIconButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoLotus: {
    fontFamily: FONTS.heading.bold,
    fontSize: 22,
  },
  logoMart: {
    fontFamily: FONTS.heading.semiBold,
    fontSize: 22,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  cartBadge: {
    position: 'absolute',
    right: -8,
    top: -5,
    backgroundColor: COLORS.rose,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
});

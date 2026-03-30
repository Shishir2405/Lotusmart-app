import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useCartStore } from '../../store/cart.store';
import { useAuthStore } from '../../store/auth.store';
import { FONTS } from '../../config/fonts';

export function HomeHeader() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const itemCount = useCartStore((state) => state.getItemCount());
  const user = useAuthStore((state) => state.user);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={[styles.logoLotus, { color: theme.colors.primary }]}>Lotus</Text>
          <Text style={[styles.logoMart, { color: theme.colors.text }]}>Mart</Text>
        </View>

        {/* Right Icons */}
        <View style={styles.rightIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('CartTab')}
            activeOpacity={0.7}
          >
            <View>
              <Ionicons name="cart-outline" size={22} color={theme.colors.text} />
              {itemCount > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.cartBadgeText}>
                    {itemCount > 99 ? '99+' : itemCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              if (user) {
                navigation.navigate('ProfileTab');
              } else {
                navigation.navigate('Auth', { screen: 'Login' });
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={user ? 'person' : 'person-outline'}
              size={22}
              color={user ? theme.colors.primary : theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    alignItems: 'baseline',
  },
  logoLotus: {
    fontFamily: FONTS.heading.bold,
    fontSize: 24,
  },
  logoMart: {
    fontFamily: FONTS.heading.semiBold,
    fontSize: 24,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    right: -6,
    top: -4,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
});

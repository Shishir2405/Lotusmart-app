import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../config/constants';
import { FONTS } from '../../config/fonts';
import logoImage from '../../../assets/logo.png';

export function SplashScreen() {
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(-10);
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const textOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(15);
  const taglineOpacity = useSharedValue(0);
  const shimmerX = useSharedValue(-1);
  const dotScale1 = useSharedValue(0.4);
  const dotScale2 = useSharedValue(0.4);
  const dotScale3 = useSharedValue(0.4);

  useEffect(() => {
    // Logo entrance
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoRotate.value = withSpring(0, { damping: 12, stiffness: 80 });

    // Ring pulse
    ringOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    ringScale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 80 }));

    // Text entrance
    textOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    textTranslateY.value = withDelay(500, withSpring(0, { damping: 14, stiffness: 100 }));

    // Tagline entrance
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
    taglineTranslateY.value = withDelay(700, withSpring(0, { damping: 14, stiffness: 100 }));

    // Shimmer
    shimmerX.value = withDelay(
      900,
      withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true),
    );

    // Loading dots
    dotScale1.value = withDelay(
      900,
      withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.4, { duration: 400 })),
        -1,
      ),
    );
    dotScale2.value = withDelay(
      1050,
      withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.4, { duration: 400 })),
        -1,
      ),
    );
    dotScale3.value = withDelay(
      1200,
      withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.4, { duration: 400 })),
        -1,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotate.value}deg` }],
    opacity: logoOpacity.value,
  }));

  const ringAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  const taglineAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: taglineTranslateY.value }],
    opacity: taglineOpacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerX.value, [-1, 0, 1], [0.3, 1, 0.3]),
  }));

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale1.value }],
    opacity: dotScale1.value,
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale2.value }],
    opacity: dotScale2.value,
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale3.value }],
    opacity: dotScale3.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <LinearGradient
        colors={[COLORS.background, '#FFF5EE', COLORS.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.content}>
        {/* Decorative ring */}
        <Animated.View style={[styles.outerRing, ringAnimStyle]}>
          <LinearGradient
            colors={[COLORS.roseLight, COLORS.goldLight, COLORS.roseLight]}
            style={styles.outerRingGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimStyle]}>
          <View style={styles.logoCircle}>
            <Image source={logoImage} style={styles.logo} resizeMode="contain" />
          </View>
        </Animated.View>

        {/* Brand name */}
        <Animated.Text style={[styles.brandName, textAnimStyle]}>LotusMart</Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineAnimStyle]}>
          Premium Spices & Dry Fruits
        </Animated.Text>
      </View>

      {/* Loading indicator */}
      <Animated.View style={[styles.footer, shimmerStyle]}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { backgroundColor: COLORS.rose }, dot1Style]} />
          <Animated.View style={[styles.dot, { backgroundColor: COLORS.gold }, dot2Style]} />
          <Animated.View style={[styles.dot, { backgroundColor: COLORS.olive }, dot3Style]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -20,
    overflow: 'hidden',
  },
  outerRingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    opacity: 0.4,
  },
  logoContainer: {
    marginBottom: 28,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.rose,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 2.5,
    borderColor: COLORS.roseLight,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  brandName: {
    fontFamily: FONTS.heading.bold,
    fontSize: 38,
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: FONTS.body.regular,
    fontSize: 15,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

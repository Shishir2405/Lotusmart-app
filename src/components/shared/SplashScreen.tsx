import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../config/constants';
import { FONTS } from '../../config/fonts';
import logoImage from '../../../assets/logo.png';

const { width: SCREEN_W } = Dimensions.get('window');

const LOGO_SIZE = 124;

export function SplashScreen() {
  // Logo: starts off-screen to the right, scaled down, faded out, slightly rotated.
  const logoTranslateX = useSharedValue(SCREEN_W * 0.55);
  const logoScale = useSharedValue(0.55);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(12);

  // Soft pink glow behind the mark.
  const glowScale = useSharedValue(0.6);
  const glowOpacity = useSharedValue(0);

  // Brand text + tagline rise in with a stagger.
  const titleTranslateY = useSharedValue(24);
  const titleOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(18);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo slides in from the right corner, fades up, and spring-settles to rest.
    logoOpacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) });
    logoTranslateX.value = withSpring(0, { damping: 13, stiffness: 110, mass: 0.9 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 120, mass: 0.9 });
    logoRotate.value = withSpring(0, { damping: 11, stiffness: 90 });

    // Glow blooms in just behind the settling mark.
    glowOpacity.value = withDelay(160, withTiming(1, { duration: 500 }));
    glowScale.value = withDelay(160, withSpring(1, { damping: 14, stiffness: 70 }));

    // Title rises after the mark lands.
    titleOpacity.value = withDelay(420, withTiming(1, { duration: 420 }));
    titleTranslateY.value = withDelay(420, withSpring(0, { damping: 15, stiffness: 110 }));

    // Tagline staggers in just after the title.
    taglineOpacity.value = withDelay(580, withTiming(1, { duration: 420 }));
    taglineTranslateY.value = withDelay(580, withSpring(0, { damping: 15, stiffness: 110 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateX: logoTranslateX.value },
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineAnimStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Cream full-bleed background */}
      <LinearGradient
        colors={[COLORS.background, '#FFF5EE', COLORS.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.content}>
        <View style={styles.markWrap}>
          {/* Soft pink glow behind the circular mark */}
          <Animated.View style={[styles.glow, glowAnimStyle]} pointerEvents="none">
            <LinearGradient
              colors={[COLORS.rose, COLORS.roseLight, 'transparent']}
              style={styles.glowGradient}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Circular logo mark, slides in from the right */}
          <Animated.View style={[styles.logoCircle, logoAnimStyle]}>
            <Image source={logoImage} style={styles.logo} resizeMode="cover" />
          </Animated.View>
        </View>

        {/* Brand name */}
        <Animated.Text style={[styles.brandName, titleAnimStyle]}>LotusMart</Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineAnimStyle]}>
          Premium Spices &amp; Dry Fruits
        </Animated.Text>
      </View>
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
  markWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  glow: {
    position: 'absolute',
    width: LOGO_SIZE * 1.7,
    height: LOGO_SIZE * 1.7,
    borderRadius: (LOGO_SIZE * 1.7) / 2,
    overflow: 'hidden',
    opacity: 0.45,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: (LOGO_SIZE * 1.7) / 2,
    opacity: 0.35,
  },
  logoCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.rose,
    shadowColor: COLORS.rose,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 14,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: LOGO_SIZE / 2,
  },
  brandName: {
    fontFamily: FONTS.heading.bold,
    fontSize: 40,
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  tagline: {
    fontFamily: FONTS.body.regular,
    fontSize: 15,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Button, Input, GoogleSignInButton } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { loginSchema, LoginFormData } from '../../../utils/validators';
import { useLogin } from '../hooks';
import { AuthStackParamList } from '../types';
import { FONTS } from '../../../config/fonts';
import { COLORS, SHOW_GOOGLE_AUTH } from '../../../config/constants';
import logoImage from '../../../../assets/logo.png';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<LoginNavProp>();
  const { showToast } = useToast();
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const goToMain = () => {
    (navigation as NativeStackNavigationProp<Record<string, object | undefined>>).reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const routeAfterAuth = (profileComplete: boolean) => {
    if (profileComplete) {
      goToMain();
      return;
    }
    navigation.navigate('CompleteProfile');
  };

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: (res) => {
        const user = res.data?.user;
        routeAfterAuth(Boolean(user?.profileComplete));
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        const message =
          error?.response?.data?.message || error?.message || 'Login failed. Please try again.';
        showToast('error', message);
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.brandSection}>
            <View style={styles.logoWrapper}>
              <Image source={logoImage} style={styles.logo} resizeMode="contain" />
            </View>
            <Text
              style={[
                styles.brandName,
                { color: theme.colors.text, fontFamily: FONTS.heading.bold },
              ]}
            >
              LotusMart
            </Text>
            <Text
              style={[
                styles.tagline,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              Premium Spices & Dry Fruits
            </Text>
          </Animated.View>

          {/* Welcome Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text
              style={[styles.heading, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
            >
              Welcome back
            </Text>
            <Text
              style={[
                styles.subheading,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              Sign in to your account to continue
            </Text>
          </Animated.View>

          {/* Google Sign-In — hidden via SHOW_GOOGLE_AUTH until native OAuth is configured */}
          {SHOW_GOOGLE_AUTH && (
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={styles.googleSection}
            >
              <GoogleSignInButton
                label="Continue with Google"
                onSignedIn={({ profileComplete }) => routeAfterAuth(profileComplete)}
              />
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                <Text
                  style={[
                    styles.dividerText,
                    { color: theme.colors.textSecondary, fontFamily: FONTS.body.medium },
                  ]}
                >
                  or sign in with email
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              </View>
            </Animated.View>
          )}

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.formSection}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  leftIcon={
                    <Ionicons name="mail-outline" size={18} color={theme.colors.textSecondary} />
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                  }
                />
              )}
            />

            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => navigation.navigate('ForgotPassword')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  styles.forgotText,
                  { color: theme.colors.primary, fontFamily: FONTS.body.semiBold },
                ]}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Button
              size="lg"
              fullWidth
              isLoading={loginMutation.isPending}
              onPress={handleSubmit(onSubmit)}
            >
              Sign In
            </Button>
          </Animated.View>

          {/* Trust badges */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.trustSection}>
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Ionicons name="leaf-outline" size={16} color={COLORS.olive} />
                <Text style={[styles.trustText, { fontFamily: FONTS.body.medium }]}>
                  100% Natural
                </Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.olive} />
                <Text style={[styles.trustText, { fontFamily: FONTS.body.medium }]}>
                  FSSAI Certified
                </Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="car-outline" size={16} color={COLORS.olive} />
                <Text style={[styles.trustText, { fontFamily: FONTS.body.medium }]}>
                  Free Shipping
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Register link */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.footer}>
            <Text
              style={[
                styles.footerText,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              {"Don't have an account? "}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  styles.footerLink,
                  { color: theme.colors.primary, fontFamily: FONTS.body.bold },
                ]}
              >
                Register
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
  brandSection: { alignItems: 'center', marginBottom: 36 },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.roseLight,
  },
  logo: { width: 52, height: 52, borderRadius: 26 },
  brandName: { fontSize: 32, letterSpacing: 1 },
  tagline: { fontSize: 14, marginTop: 4, letterSpacing: 0.5 },
  heading: { fontSize: 26, marginBottom: 4 },
  subheading: { fontSize: 15, marginBottom: 28 },
  googleSection: { marginBottom: 18 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  formSection: { gap: 0 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotText: { fontSize: 14 },
  trustSection: { marginTop: 32 },
  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { fontSize: 11, color: COLORS.textSecondary },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});

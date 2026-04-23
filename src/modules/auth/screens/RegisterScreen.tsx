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
import { Button, Input } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { registerSchema, RegisterFormData } from '../../../utils/validators';
import { useRegister } from '../hooks';
import { AuthStackParamList } from '../types';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';
import logoImage from '../../../../assets/logo.png';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<RegisterNavProp>();
  const { showToast } = useToast();
  const registerMutation = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(
      {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        address: data.address,
      },
      {
        onSuccess: () => {
          (navigation as NativeStackNavigationProp<Record<string, object | undefined>>).reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
          const message =
            error?.response?.data?.message ||
            error?.message ||
            'Registration failed. Please try again.';
          showToast('error', message);
        },
      },
    );
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
          </Animated.View>

          {/* Welcome Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text
              style={[styles.heading, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
            >
              Create account
            </Text>
            <Text
              style={[
                styles.subheading,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              Join us for the finest quality products
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.formSection}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  autoComplete="name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  leftIcon={
                    <Ionicons name="person-outline" size={18} color={theme.colors.textSecondary} />
                  }
                />
              )}
            />

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
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  leftIcon={
                    <Ionicons name="call-outline" size={18} color={theme.colors.textSecondary} />
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
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
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

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  leftIcon={
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                  }
                />
              )}
            />

            <View style={{ marginTop: 8 }}>
              <Button
                size="lg"
                fullWidth
                isLoading={registerMutation.isPending}
                onPress={handleSubmit(onSubmit)}
              >
                Create Account
              </Button>
            </View>
          </Animated.View>

          {/* Benefits */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(400)}
            style={styles.benefitsSection}
          >
            <View style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: COLORS.roseLight }]}>
                <Ionicons name="gift-outline" size={16} color={COLORS.rose} />
              </View>
              <Text
                style={[
                  styles.benefitText,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                ]}
              >
                Get exclusive offers & early access
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: COLORS.oliveLight }]}>
                <Ionicons name="cube-outline" size={16} color={COLORS.olive} />
              </View>
              <Text
                style={[
                  styles.benefitText,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                ]}
              >
                Track orders & save addresses
              </Text>
            </View>
          </Animated.View>

          {/* Login link */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.footer}>
            <Text
              style={[
                styles.footerText,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  styles.footerLink,
                  { color: theme.colors.primary, fontFamily: FONTS.body.bold },
                ]}
              >
                Login
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 },
  brandSection: { alignItems: 'center', marginBottom: 28 },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.roseLight,
  },
  logo: { width: 46, height: 46, borderRadius: 23 },
  brandName: { fontSize: 28, letterSpacing: 1 },
  heading: { fontSize: 24, marginBottom: 4 },
  subheading: { fontSize: 15, marginBottom: 24 },
  formSection: { gap: 0 },
  benefitsSection: { marginTop: 24, gap: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { fontSize: 13, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});

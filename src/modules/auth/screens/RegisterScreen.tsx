import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '../../../theme/ThemeContext';
import { Button, Input } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { registerSchema, RegisterFormData } from '../../../utils/validators';
import { useRegister } from '../hooks';
import { AuthStackParamList } from '../types';

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
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(
      { name: data.name, email: data.email, password: data.password },
      {
        onSuccess: () => {
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        },
        onError: (error: any) => {
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
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View style={styles.brandContainer}>
            <Text style={[styles.brandName, { color: theme.colors.primary }]}>
              LotusMart
            </Text>
            <Text
              style={[styles.tagline, { color: theme.colors.textSecondary }]}
            >
              Premium Spices & Dry Fruits
            </Text>
          </View>

          {/* Heading */}
          <Text style={[styles.heading, { color: theme.colors.text }]}>
            Create account
          </Text>
          <Text
            style={[
              styles.subheading,
              { color: theme.colors.textSecondary, marginBottom: theme.spacing['3xl'] },
            ]}
          >
            Join us for the finest quality products
          </Text>

          {/* Form */}
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
              />
            )}
          />

          {/* Submit */}
          <View style={styles.buttonWrapper}>
            <Button
              size="lg"
              fullWidth
              isLoading={registerMutation.isPending}
              onPress={handleSubmit(onSubmit)}
            >
              Create Account
            </Button>
          </View>

          {/* Login link */}
          <View style={styles.footer}>
            <Text
              style={[styles.footerText, { color: theme.colors.textSecondary }]}
            >
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[styles.footerLink, { color: theme.colors.primary }]}
              >
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '400',
  },
  buttonWrapper: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '400',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

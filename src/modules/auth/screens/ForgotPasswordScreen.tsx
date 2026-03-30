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
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from '../../../utils/validators';
import { useForgotPassword } from '../hooks';
import { AuthStackParamList } from '../types';

type ForgotPasswordNavProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<ForgotPasswordNavProp>();
  const { showToast } = useToast();
  const forgotMutation = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotMutation.mutate(data.email, {
      onSuccess: () => {
        showToast('success', 'Reset link sent! Check your email inbox.');
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Something went wrong. Please try again.';
        showToast('error', message);
      },
    });
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
            Forgot password?
          </Text>
          <Text
            style={[
              styles.subheading,
              { color: theme.colors.textSecondary, marginBottom: theme.spacing['3xl'] },
            ]}
          >
            Enter your email and we'll send you a link to reset your password.
          </Text>

          {/* Success message */}
          {forgotMutation.isSuccess && (
            <View
              style={[
                styles.successBox,
                {
                  backgroundColor: theme.colors.success + '14',
                  borderColor: theme.colors.success,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
            >
              <Text style={[styles.successText, { color: theme.colors.success }]}>
                A password reset link has been sent to your email address. Please
                check your inbox and spam folder.
              </Text>
            </View>
          )}

          {/* Form */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="Enter your registered email"
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

          {/* Submit */}
          <View style={styles.buttonWrapper}>
            <Button
              size="lg"
              fullWidth
              isLoading={forgotMutation.isPending}
              onPress={handleSubmit(onSubmit)}
            >
              Send Reset Link
            </Button>
          </View>

          {/* Back to login */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => navigation.navigate('Login')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.backText, { color: theme.colors.primary }]}>
              Back to Login
            </Text>
          </TouchableOpacity>
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
    paddingTop: 48,
    paddingBottom: 32,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
    lineHeight: 22,
  },
  successBox: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  buttonWrapper: {
    marginTop: 8,
  },
  backRow: {
    alignSelf: 'center',
    marginTop: 32,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

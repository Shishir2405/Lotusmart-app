import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../../../theme/ThemeContext';
import { Button, Input } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { useChangePassword } from '../hooks';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const changePassword = useChangePassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = useCallback(
    (data: ChangePasswordFormData) => {
      changePassword.mutate(
        {
          oldPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        {
          onSuccess: () => {
            showToast('success', 'Password changed successfully');
            navigation.goBack();
          },
          onError: (error: any) => {
            const message =
              error?.response?.data?.message ?? 'Failed to change password';
            showToast('error', message);
          },
        },
      );
    },
    [changePassword, showToast, navigation],
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon Header */}
          <View style={styles.iconSection}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primary + '14' },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={36}
                color={theme.colors.primary}
              />
            </View>
            <Text
              style={[
                styles.title,
                { color: theme.colors.text, fontSize: theme.fontSizes.xl },
              ]}
            >
              Change Password
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSizes.sm,
                },
              ]}
            >
              Enter your current password and choose a new one
            </Text>
          </View>

          {/* Form */}
          <View
            style={[
              styles.formContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
          >
            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Current Password"
                  placeholder="Enter your current password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.currentPassword?.message}
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New Password"
                  placeholder="At least 8 characters"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.newPassword?.message}
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}
            />

            {/* Password Requirements */}
            <View style={styles.requirements}>
              <Text
                style={[
                  styles.requirementsTitle,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSizes.xs,
                  },
                ]}
              >
                Password requirements:
              </Text>
              <View style={styles.requirementRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSizes.xs,
                    },
                  ]}
                >
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSizes.xs,
                    },
                  ]}
                >
                  One uppercase letter
                </Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSizes.xs,
                    },
                  ]}
                >
                  One number
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <Button
              size="lg"
              fullWidth
              onPress={handleSubmit(onSubmit)}
              isLoading={changePassword.isPending}
            >
              Update Password
            </Button>
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  requirements: {
    paddingTop: 4,
    gap: 6,
  },
  requirementsTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requirementText: {
    fontWeight: '400',
  },
  buttonContainer: {
    marginBottom: 16,
  },
});

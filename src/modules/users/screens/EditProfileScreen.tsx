import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../../../theme/ThemeContext';
import { Button, Input } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { PermissionModal } from '../../../components/ui/PermissionModal';
import { useAuthStore } from '../../../store/auth.store';
import { useUpdateProfile } from '../../auth/hooks';
import { uploadImage } from '../../../services/upload';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';

const editProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^[+]?[\d\s-]+$/, 'Please enter a valid phone number'),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [uploading, setUploading] = useState(false);
  const [permissionModal, setPermissionModal] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
    },
  });

  const getInitials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const openPicker = useCallback(async () => {
    setPermissionModal(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const { url } = await uploadImage(asset.uri, 'profiles');
      setAvatar(url);
      await updateProfile.mutateAsync({ avatar: url });
      showToast('success', 'Profile photo updated');
    } catch (err) {
      const message = (err as Error)?.message ?? 'Upload failed';
      showToast('error', message);
    } finally {
      setUploading(false);
    }
  }, [updateProfile, showToast]);

  const handlePickImage = useCallback(async () => {
    const { status: current } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (current === 'granted') {
      void openPicker();
      return;
    }
    setPermissionModal(true);
  }, [openPicker]);

  const requestPermissionAndPick = useCallback(async () => {
    setPermissionModal(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast(
        'error',
        'Photo library access was denied. Enable it in Settings to change your avatar.',
      );
      return;
    }
    void openPicker();
  }, [openPicker, showToast]);

  const onSubmit = useCallback(
    (data: EditProfileForm) => {
      updateProfile.mutate(
        { name: data.name, phone: data.phone },
        {
          onSuccess: () => {
            showToast('success', 'Profile updated');
            navigation.goBack();
          },
          onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            const message =
              error?.response?.data?.message || error?.message || 'Could not save your profile';
            showToast('error', message);
          },
        },
      );
    },
    [updateProfile, showToast, navigation],
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.rose} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: COLORS.rose }]}>
                  <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handlePickImage}
                disabled={uploading}
                activeOpacity={0.85}
                style={[styles.editBadge, { backgroundColor: COLORS.rose }]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handlePickImage}
              disabled={uploading}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text
                style={[
                  styles.changeAvatarText,
                  { color: COLORS.rose, fontFamily: FONTS.body.semiBold },
                ]}
              >
                {uploading ? 'Uploading...' : 'Change photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
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

            <View style={{ marginBottom: 16 }}>
              <Text
                style={[
                  styles.readOnlyLabel,
                  { color: theme.colors.text, fontFamily: FONTS.body.medium },
                ]}
              >
                Email
              </Text>
              <View
                style={[
                  styles.readOnlyBox,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <Ionicons name="mail-outline" size={18} color={theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.readOnlyValue,
                    { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                  ]}
                  numberOfLines={1}
                >
                  {user.email}
                </Text>
                <View style={[styles.lockBadge, { backgroundColor: theme.colors.border }]}>
                  <Ionicons name="lock-closed" size={12} color={theme.colors.textSecondary} />
                </View>
              </View>
              <Text
                style={[
                  styles.readOnlyHint,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
                ]}
              >
                Email is the unique identifier for your account and can&apos;t be changed here.
              </Text>
            </View>

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="10-digit mobile number"
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

            <Button
              size="lg"
              fullWidth
              isLoading={updateProfile.isPending}
              onPress={handleSubmit(onSubmit)}
              disabled={!isDirty || updateProfile.isPending}
            >
              Save changes
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PermissionModal
        visible={permissionModal}
        icon="image-outline"
        iconColor={COLORS.rose}
        iconBackground={COLORS.roseLight}
        title="Access your photos?"
        description="LotusMart needs access to your photo library so you can pick a new profile picture. You can skip this anytime."
        allowLabel="Continue"
        denyLabel="Not now"
        onAllow={requestPermissionAndPick}
        onDeny={() => setPermissionModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap: { position: 'relative', marginBottom: 10 },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F0EA',
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: FONTS.heading.bold,
    letterSpacing: 1,
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changeAvatarText: { fontSize: 13, letterSpacing: 0.2 },
  form: { gap: 4 },
  readOnlyLabel: { fontSize: 14, marginBottom: 4 },
  readOnlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
  },
  readOnlyValue: { flex: 1, fontSize: 14 },
  lockBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyHint: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Button, Input } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { LocationPicker, LocationPickerValue } from '../../../components/shared/LocationPicker';
import { useCompleteProfile } from '../hooks';
import { useAuthStore } from '../../../store/auth.store';
import { FONTS } from '../../../config/fonts';
import { COLORS } from '../../../config/constants';
import { AddressLabel } from '../../../types';

type Nav = NativeStackNavigationProp<Record<string, object | undefined>>;

interface FormState {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  label: AddressLabel;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}

const EMPTY: FormState = {
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  label: 'home',
};

const LABELS: { value: AddressLabel; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'home', label: 'Home', icon: 'home-outline' },
  { value: 'work', label: 'Work', icon: 'briefcase-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function CompleteProfileScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const { showToast } = useToast();
  const completeProfileMutation = useCompleteProfile();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      phone: user.phone ?? f.phone,
    }));
  }, [user]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const onLocation = (value: LocationPickerValue) => {
    setForm((f) => ({
      ...f,
      addressLine1: value.addressLine1 || f.addressLine1,
      addressLine2: value.addressLine2 ?? f.addressLine2,
      city: value.city || f.city,
      state: value.state || f.state,
      pincode: value.pincode || f.pincode,
      coordinates: value.coordinates ?? f.coordinates,
      formattedAddress: value.formattedAddress ?? f.formattedAddress,
    }));
  };

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!/^[+]?[\d\s-]{10,15}$/.test(form.phone)) {
      e.phone = 'Enter a valid 10-15 digit mobile number';
    }
    if (form.addressLine1.trim().length < 5) {
      e.addressLine1 = 'Address must be at least 5 characters';
    }
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Pincode must be 6 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToMain = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const onSubmit = () => {
    if (!validate()) {
      showToast('error', 'Please fix the highlighted fields.');
      return;
    }
    completeProfileMutation.mutate(
      {
        phone: form.phone,
        address: {
          fullName: user?.name,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || undefined,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          label: form.label,
          coordinates: form.coordinates,
          formattedAddress: form.formattedAddress,
        },
      },
      {
        onSuccess: () => {
          showToast('success', 'Profile saved');
          goToMain();
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
          const message =
            error?.response?.data?.message ||
            error?.message ||
            'Could not save your profile. Please try again.';
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
          <Animated.View entering={FadeIn.duration(400)}>
            <Text
              style={[styles.heading, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
            >
              Complete your profile
            </Text>
            <Text
              style={[
                styles.subheading,
                { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
              ]}
            >
              A couple of details so we can deliver to you and keep you updated.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Input
              label="Mobile Number"
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => set('phone', v)}
              error={errors.phone}
              leftIcon={
                <Ionicons name="call-outline" size={18} color={theme.colors.textSecondary} />
              }
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(280).duration(400)}
            style={[
              styles.mapSection,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={16} color={COLORS.rose} />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text, fontFamily: FONTS.body.semiBold },
                ]}
              >
                Your delivery address
              </Text>
            </View>
            <LocationPicker
              initialValue={{
                addressLine1: form.addressLine1,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
                coordinates: form.coordinates,
                formattedAddress: form.formattedAddress,
              }}
              onChange={onLocation}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(360).duration(400)} style={styles.section}>
            <Input
              label="Address Line 1"
              placeholder="Flat / House No., Building, Street"
              value={form.addressLine1}
              onChangeText={(v) => set('addressLine1', v)}
              error={errors.addressLine1}
            />
            <Input
              label="Address Line 2 (optional)"
              placeholder="Locality, Landmark"
              value={form.addressLine2}
              onChangeText={(v) => set('addressLine2', v)}
            />
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Input
                  label="City"
                  placeholder="City"
                  value={form.city}
                  onChangeText={(v) => set('city', v)}
                  error={errors.city}
                />
              </View>
              <View style={styles.rowItem}>
                <Input
                  label="State"
                  placeholder="State"
                  value={form.state}
                  onChangeText={(v) => set('state', v)}
                  error={errors.state}
                />
              </View>
            </View>
            <Input
              label="Pincode"
              placeholder="6-digit pincode"
              keyboardType="number-pad"
              maxLength={6}
              value={form.pincode}
              onChangeText={(v) => set('pincode', v)}
              error={errors.pincode}
            />

            <Text
              style={[styles.label, { color: theme.colors.text, fontFamily: FONTS.body.medium }]}
            >
              Address Type
            </Text>
            <View style={styles.labelRow}>
              {LABELS.map((l) => {
                const active = form.label === l.value;
                return (
                  <TouchableOpacity
                    key={l.value}
                    onPress={() => set('label', l.value)}
                    activeOpacity={0.85}
                    style={[
                      styles.labelChip,
                      {
                        borderColor: active ? COLORS.rose : theme.colors.border,
                        backgroundColor: active ? COLORS.roseLight : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={l.icon}
                      size={14}
                      color={active ? COLORS.rose : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.labelChipText,
                        {
                          color: active ? COLORS.rose : theme.colors.textSecondary,
                          fontFamily: FONTS.body.semiBold,
                        },
                      ]}
                    >
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(460).duration(400)} style={styles.submitRow}>
            <Button
              size="lg"
              fullWidth
              isLoading={completeProfileMutation.isPending}
              onPress={onSubmit}
            >
              Save and continue
            </Button>
            <TouchableOpacity
              onPress={goToMain}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.skipBtn}
            >
              <Text
                style={[
                  styles.skipText,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.medium },
                ]}
              >
                Skip for now
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
  scrollContent: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 40 },
  heading: { fontSize: 26, marginBottom: 6 },
  subheading: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  section: { marginTop: 8 },
  mapSection: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, letterSpacing: 0.2 },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  label: { fontSize: 13, marginBottom: 8, marginTop: 4 },
  labelRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  labelChipText: { fontSize: 12 },
  submitRow: { marginTop: 12, gap: 12 },
  skipBtn: { alignSelf: 'center', paddingVertical: 6 },
  skipText: { fontSize: 13 },
});

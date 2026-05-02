import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../config/fonts';
import { useToast } from './Toast';
import { useGoogleAuth } from '../../modules/auth/hooks';
import { useGoogleIdToken } from '../../services/googleAuth';

interface Props {
  label?: string;
  onSignedIn?: (user: { profileComplete: boolean; isNew: boolean }) => void;
  style?: ViewStyle;
}

function GoogleLogo() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.257h2.908c1.702-1.567 2.684-3.874 2.684-6.614z"
        fill="#4285F4"
      />
      <Path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <Path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <Path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function GoogleSignInButton({ label = 'Continue with Google', onSignedIn, style }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const googleAuthMutation = useGoogleAuth();

  const handleIdToken = useCallback(
    (idToken: string) => {
      googleAuthMutation.mutate(idToken, {
        onSuccess: (res) => {
          const { isNew, profileComplete } = res.data!;
          onSignedIn?.({ isNew, profileComplete });
          showToast('success', isNew ? 'Account created with Google' : 'Signed in with Google');
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
          const message =
            error?.response?.data?.message ||
            error?.message ||
            'Google sign-in failed. Please try again.';
          showToast('error', message);
        },
      });
    },
    [googleAuthMutation, onSignedIn, showToast],
  );

  const handleError = useCallback(
    (message: string) => {
      showToast('error', message);
    },
    [showToast],
  );

  const { request, promptAsync, isConfigured } = useGoogleIdToken(handleIdToken, handleError);

  const loading = googleAuthMutation.isPending;
  const disabled = !request || !isConfigured || loading;

  const onPress = async () => {
    if (!isConfigured) {
      showToast('error', 'Google Sign-In is not set up for this build. Please use email login.');
      return;
    }
    await promptAsync();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.btn,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.textSecondary} />
      ) : (
        <View style={styles.content}>
          <GoogleLogo />
          <Text
            style={[styles.label, { color: theme.colors.text, fontFamily: FONTS.body.semiBold }]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default GoogleSignInButton;

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.6,
  },
});

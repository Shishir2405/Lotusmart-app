import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  multiline?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  secureTextEntry,
  multiline,
  containerStyle,
  inputStyle,
  ...textInputProps
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      textInputProps.onFocus?.(e);
    },
    [textInputProps.onFocus],
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      textInputProps.onBlur?.(e);
    },
    [textInputProps.onBlur],
  );

  const borderColor = error
    ? theme.colors.error
    : isFocused
      ? theme.colors.primary
      : theme.colors.border;

  const toggleSecure = useCallback(() => {
    setIsSecureVisible((prev) => !prev);
  }, []);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.text,
              fontSize: theme.fontSizes.sm,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
          },
          isFocused && {
            borderWidth: 1.5,
          },
          multiline && styles.multiline,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          {...textInputProps}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          multiline={multiline}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: theme.fontSizes.base,
            },
            multiline && styles.multilineInput,
            inputStyle,
          ]}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={toggleSecure}
            style={styles.iconRight}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.fontSizes.sm,
              }}
            >
              {isSecureVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}

        {!secureTextEntry && rightIcon && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>

      {error && (
        <Text
          style={[
            styles.error,
            {
              color: theme.colors.error,
              fontSize: theme.fontSizes.xs,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  multiline: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
  error: {
    fontWeight: '400',
  },
});

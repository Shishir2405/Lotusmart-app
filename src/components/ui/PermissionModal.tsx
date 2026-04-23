import React, { useEffect, useRef } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../config/fonts';
import { COLORS } from '../../config/constants';

export interface PermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  description: string;
  allowLabel?: string;
  denyLabel?: string;
}

export function PermissionModal({
  visible,
  onAllow,
  onDeny,
  icon = 'location-outline',
  iconColor = COLORS.rose,
  iconBackground = COLORS.roseLight,
  title,
  description,
  allowLabel = 'Allow',
  denyLabel = 'Not now',
}: PermissionModalProps) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 16,
          stiffness: 220,
          mass: 0.8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.9);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDeny}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDeny} />
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              transform: [{ scale }],
            },
          ]}
        >
          <View style={[styles.iconBubble, { backgroundColor: iconBackground }]}>
            <Ionicons name={icon} size={28} color={iconColor} />
          </View>

          <Text
            style={[styles.title, { color: theme.colors.text, fontFamily: FONTS.heading.bold }]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.description,
              { color: theme.colors.textSecondary, fontFamily: FONTS.body.regular },
            ]}
          >
            {description}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onDeny}
              activeOpacity={0.8}
              style={[styles.btn, styles.btnGhost, { borderColor: theme.colors.border }]}
            >
              <Text
                style={[
                  styles.btnText,
                  { color: theme.colors.textSecondary, fontFamily: FONTS.body.semiBold },
                ]}
              >
                {denyLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onAllow}
              activeOpacity={0.85}
              style={[styles.btn, styles.btnPrimary]}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF', fontFamily: FONTS.body.bold }]}>
                {allowLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 15, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
  },
  iconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: COLORS.rose,
    shadowColor: COLORS.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
});

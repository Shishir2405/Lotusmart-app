import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  transparent?: boolean;
}

export function Header({ title, showBack = false, rightAction, transparent = false }: HeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    safeArea: {
      paddingTop: insets.top,
      backgroundColor: transparent ? 'transparent' : theme.colors.surface,
      borderBottomWidth: transparent ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 52,
      paddingHorizontal: theme.spacing.lg,
    },
    leftSlot: {
      width: 40,
      alignItems: 'flex-start',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: transparent ? 'rgba(0,0,0,0.3)' : theme.colors.background,
    },
    titleContainer: {
      flex: 1,
      alignItems: 'center',
    },
    title: {
      fontSize: theme.fontSizes.lg,
      fontWeight: '700',
      color: transparent ? '#FFFFFF' : theme.colors.text,
    },
    rightSlot: {
      width: 40,
      alignItems: 'flex-end',
    },
  });

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftSlot}>
          {showBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons
                name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                size={22}
                color={transparent ? '#FFFFFF' : theme.colors.text}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.rightSlot}>{rightAction}</View>
      </View>
    </View>
  );
}

import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  const { theme } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrapper}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={styles.overlay}
        />

        <View
          style={[
            styles.content,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.borderRadius.xl,
              borderTopRightRadius: theme.borderRadius.xl,
            },
          ]}
        >
          <View
            style={[
              styles.titleBar,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.handle}>
              <View
                style={[
                  styles.handleBar,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </View>

            {title && (
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.text,
                    fontSize: theme.fontSizes.lg,
                  },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: theme.colors.border + '40' },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  styles.closeText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>{children}</View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  titleBar: {
    flexDirection: 'column',
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: '700',
    marginTop: 8,
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
  },
  body: {
    padding: 20,
  },
});

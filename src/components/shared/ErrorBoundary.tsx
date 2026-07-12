import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * App-wide safety net. Without this, ANY uncaught exception thrown during render
 * (a malformed API item, an undefined nested field, etc.) unmounts the whole
 * React tree → white screen / crash in production with no recovery. This catches
 * it and shows a friendly fallback with a "Try again" that re-mounts the subtree.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    }
    // Production: hook a crash-reporting service here (Sentry, etc.) if added.
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😕</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>The app hit an unexpected error. Please try again.</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFDF7',
  },
  emoji: { fontSize: 44, marginBottom: 12 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#E8567F',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

export default ErrorBoundary;

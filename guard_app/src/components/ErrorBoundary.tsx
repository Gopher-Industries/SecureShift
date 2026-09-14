import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { captureReactError } from '../lib/sentry';
import { useAppTheme } from '../theme';

import type { AppColors } from '../theme/colors';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

  return (
    <View style={s.container}>
      <Ionicons name="alert-circle-outline" size={56} color={colors.status.rejected} />
      <Text style={s.title}>{t('err.crashTitle')}</Text>
      <Text style={s.message}>{t('err.crashMessage')}</Text>
      <TouchableOpacity style={s.button} onPress={onRetry}>
        <Text style={s.buttonText}>{t('err.tryAgain')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // we only replace the screen, the real error still goes to the logs
    console.error('Caught by ErrorBoundary:', error, info.componentStack);
    captureReactError(error, info.componentStack ?? undefined);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 28,
      paddingVertical: 12,
    },
    buttonText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '700',
    },
    container: {
      alignItems: 'center',
      backgroundColor: colors.bg,
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    message: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 24,
      textAlign: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 10,
      marginTop: 14,
      textAlign: 'center',
    },
  });

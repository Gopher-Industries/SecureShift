import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
// App.tsx
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import './src/i18n'; // Initialize i18n
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineBanner from './src/components/OfflineBanner';
import AppLockProvider from './src/context/AppLockProvider';
import { attach401Handler } from './src/lib/http';
import {
  registerPushTokenIfNeeded,
  subscribeToPushTokenChanges,
} from './src/lib/pushNotifications';
import { initSentry, Sentry } from './src/lib/sentry';
import AppNavigator, { RootStackParamList } from './src/navigation/AppNavigator';
import { ThemeProvider, useAppTheme } from './src/theme';
import { setUpNotifications } from './src/utils/notificationHelpers';

// Must run before anything else so crashes during startup are captured too.
initSentry();

//allows navigation outside of components (e.g., from API handlers)
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function AppContent() {
  const { isDark, colors } = useAppTheme();

  //allows navigation outside of components (e.g., from API handlers)
  useEffect(() => {
    void setUpNotifications();

    let subscription: { remove: () => void } | null = null;

    const register = async () => {
      await registerPushTokenIfNeeded();
      subscription = subscribeToPushTokenChanges(async (newToken) => {
        await registerPushTokenIfNeeded(newToken);
      });
    };

    void register();

    // if any API call returns 401, it will clear tokens and navigate users to Login
    attach401Handler(() => {
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login', params: { sessionExpired: true } }],
        });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <View style={styles.root}>
      <OfflineBanner />
      <NavigationContainer theme={navigationTheme} ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
    </View>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppLockProvider>
          <AppContent />
        </AppLockProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

// Sentry.wrap adds native crash/ANR correlation and root-level touch
// breadcrumbs; a no-op when Sentry hasn't been initialized (no DSN set).
export default Sentry.wrap(App);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

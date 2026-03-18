import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';

import {
  registerPushTokenIfNeeded,
  subscribeToPushTokenChanges,
} from './src/lib/pushNotifications';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useAppTheme } from './src/theme';

function AppContent() {
  const { isDark, colors } = useAppTheme();

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const register = async () => {
      await registerPushTokenIfNeeded();
      subscription = subscribeToPushTokenChanges(async (newToken) => {
        await registerPushTokenIfNeeded(newToken);
      });
    };

    void register();

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
    <NavigationContainer theme={navigationTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
// App.tsx
import React, { useEffect } from 'react';

import { attach401Handler } from './src/lib/http';
import {
  registerPushTokenIfNeeded,
  subscribeToPushTokenChanges,
} from './src/lib/pushNotifications';
import AppNavigator, { RootStackParamList } from './src/navigation/AppNavigator';
import { ThemeProvider, useAppTheme } from './src/theme';

//allows navigation outside of components (e.g., from API handlers)
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function AppContent() {
  const { isDark, colors } = useAppTheme();

  //allows navigation outside of components (e.g., from API handlers)
  useEffect(() => {
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
          routes: [{ name: 'Login' }],
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

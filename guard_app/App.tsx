// App.tsx
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import React, { useEffect } from 'react';

import {
  registerPushTokenIfNeeded,
  subscribeToPushTokenChanges,
} from './src/lib/pushNotifications';
import AppNavigator, { RootStackParamList } from './src/navigation/AppNavigator';
import { attach401Handler } from './src/lib/http';

//allows navigation outside of components (e.g., from API handlers)
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
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

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

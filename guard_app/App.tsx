// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';

import AppNavigator from './src/navigation/AppNavigator';
import { registerPushTokenIfNeeded, subscribeToPushTokenChanges } from './src/lib/pushNotifications';

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

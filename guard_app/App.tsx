// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';

import AppNavigator from './src/navigation/AppNavigator';
import { onPushTokenRefresh, registerDevicePushToken } from './src/lib/pushNotifications';

export default function App() {
  useEffect(() => {
    void registerDevicePushToken();
    const unsubscribe = onPushTokenRefresh();
    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

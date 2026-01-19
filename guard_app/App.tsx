// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import { Platform, Alert } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    // Android Channel Setup
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground notification:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { title } = response.notification.request.content;
      const data = response.notification.request.content.data;

      console.log('Notification tapped:', title);

      if (data.screen === 'Shifts') {
        Alert.alert("Notification Tapped", `Redirecting to ${title}`);
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { shouldDeliverNotification } from '../lib/notificationPreferences';

// Muted categories (Settings > Notification preferences) are dropped here, so
// they neither show a banner nor play a sound while the app is running.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const deliver = await shouldDeliverNotification(notification.request.content.data);
    return {
      shouldShowBanner: deliver,
      shouldShowList: deliver,
      shouldPlaySound: deliver,
      shouldSetBadge: false,
    };
  },
});

export async function setUpNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permissions not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data,
    },
    trigger: null, // Show immediately
  });
}

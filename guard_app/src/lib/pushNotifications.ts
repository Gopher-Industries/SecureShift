import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { registerPushToken } from '../api/pushTokens';
import { LocalStorage } from './localStorage';

const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

export async function registerPushTokenIfNeeded(tokenOverride?: string): Promise<void> {
  const authToken = await LocalStorage.getToken();
  if (!authToken) return;

  const storedToken = await LocalStorage.getPushToken();
  const newToken = tokenOverride ?? (await getExpoPushToken());
  if (!newToken) return;

  if (storedToken === newToken) return;

  await registerPushToken({
    token: newToken,
    platform: Platform.OS,
  });
  await LocalStorage.setPushToken(newToken);
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    let status = permission.status;

    if (status !== 'granted') {
      const request = await Notifications.requestPermissionsAsync();
      status = request.status;
    }

    if (status !== 'granted') {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: getProjectId(),
    });
    return token.data;
  } catch (error) {
    console.warn('Failed to get push token', error);
    return null;
  }
}

export function subscribeToPushTokenChanges(onToken: (token: string) => void) {
  return Notifications.addPushTokenListener((event) => {
    if (event?.data) {
      onToken(event.data);
    }
  });
}

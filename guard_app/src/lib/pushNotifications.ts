import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerPushToken } from '../api/pushTokens';
import { LocalStorage } from './localStorage';

type RegisterResult =
  | { status: 'registered'; token: string }
  | { status: 'unchanged'; token: string }
  | { status: 'skipped'; reason: 'no-auth' | 'no-permission' | 'no-token' };

const getProjectId = () => {
  return (
    Constants?.easConfig?.projectId ??
    Constants?.expoConfig?.extra?.eas?.projectId ??
    undefined
  );
};

const getExpoPushToken = async (): Promise<string | null> => {
  const currentPermissions = await Notifications.getPermissionsAsync();
  const { status } =
    currentPermissions.status === 'granted'
      ? currentPermissions
      : await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    return null;
  }

  const projectId = getProjectId();
  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return tokenResponse.data ?? null;
};

const getDeviceInfo = () => {
  const platform = Platform.OS ?? 'unknown';
  const deviceName = Constants?.deviceName ?? null;
  return { platform, deviceName };
};

export const registerDevicePushToken = async (): Promise<RegisterResult> => {
  const authToken = await LocalStorage.getToken();
  if (!authToken) {
    return { status: 'skipped', reason: 'no-auth' };
  }

  const token = await getExpoPushToken();
  if (!token) {
    return { status: 'skipped', reason: 'no-permission' };
  }

  const savedToken = await LocalStorage.getPushToken();
  if (savedToken === token) {
    return { status: 'unchanged', token };
  }

  const { platform, deviceName } = getDeviceInfo();
  await registerPushToken({ token, platform, deviceName });
  await LocalStorage.setPushToken(token);

  return { status: 'registered', token };
};

export const onPushTokenRefresh = (
  handler?: (token: string) => void,
): (() => void) => {
  const subscription = Notifications.addPushTokenListener(async (event) => {
    const token = event?.data ?? null;
    if (!token) {
      return;
    }
    await LocalStorage.setPushToken(token);
    await registerPushToken({
      token,
      platform: Platform.OS ?? 'unknown',
      deviceName: Constants?.deviceName ?? null,
    });
    handler?.(token);
  });

  return () => subscription.remove();
};

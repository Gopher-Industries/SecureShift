/* eslint-env jest */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { LocalStorage } from '../../src/lib/localStorage';

describe('LocalStorage (session storage)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns null for the token when nothing has been stored', async () => {
    expect(await LocalStorage.getToken()).toBeNull();
  });

  it('persists and retrieves the auth token', async () => {
    await LocalStorage.setToken('jwt-123');
    expect(await LocalStorage.getToken()).toBe('jwt-123');
  });

  it('removes the auth token', async () => {
    await LocalStorage.setToken('jwt-123');
    await LocalStorage.removeToken();
    expect(await LocalStorage.getToken()).toBeNull();
  });

  it('persists and clears the profile image separately from the token', async () => {
    await LocalStorage.setToken('jwt-123');
    await LocalStorage.saveProfileImage('file://avatar.png');

    expect(await LocalStorage.getProfileImage()).toBe('file://avatar.png');

    await LocalStorage.clearProfileImage();

    expect(await LocalStorage.getProfileImage()).toBeNull();
    expect(await LocalStorage.getToken()).toBe('jwt-123');
  });

  it('persists and removes the push token', async () => {
    await LocalStorage.setPushToken('expo-push-token');
    expect(await LocalStorage.getPushToken()).toBe('expo-push-token');

    await LocalStorage.removePushToken();
    expect(await LocalStorage.getPushToken()).toBeNull();
  });

  it('clearAll wipes the whole session (token, profile image, push token)', async () => {
    await LocalStorage.setToken('jwt-123');
    await LocalStorage.saveProfileImage('file://avatar.png');
    await LocalStorage.setPushToken('expo-push-token');

    await LocalStorage.clearAll();

    expect(await LocalStorage.getToken()).toBeNull();
    expect(await LocalStorage.getProfileImage()).toBeNull();
    expect(await LocalStorage.getPushToken()).toBeNull();
  });
});

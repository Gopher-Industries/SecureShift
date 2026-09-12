import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Sensitive values (auth JWT, push token) live in the OS keychain/keystore via
// expo-secure-store. Non-secret values (profile image URI) stay in AsyncStorage.
const TOKEN_KEY = 'auth_token';
const PROFILE_IMAGE_KEY = 'profile_image';
const PUSH_TOKEN_KEY = 'push_token';

// SecureStore has no web implementation; fall back to AsyncStorage on web
// (and anywhere the native module is unavailable, e.g. some test/CI contexts).
const secureAvailable = Platform.OS !== 'web';

// --- secret helpers (with one-time migration from the old AsyncStorage keys) ---

async function setSecret(key: string, value: string): Promise<void> {
  if (secureAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function getSecret(key: string): Promise<string | null> {
  if (!secureAvailable) {
    return AsyncStorage.getItem(key);
  }

  const secure = await SecureStore.getItemAsync(key);
  if (secure !== null) {
    return secure;
  }

  // First launch after upgrade: migrate any token previously stored in
  // AsyncStorage into SecureStore, then remove the plaintext copy.
  const legacy = await AsyncStorage.getItem(key);
  if (legacy !== null) {
    await SecureStore.setItemAsync(key, legacy);
    await AsyncStorage.removeItem(key);
    return legacy;
  }

  return null;
}

async function deleteSecret(key: string): Promise<void> {
  if (secureAvailable) {
    await SecureStore.deleteItemAsync(key);
  }
  // Always clear any legacy AsyncStorage copy too.
  await AsyncStorage.removeItem(key);
}

export const LocalStorage = {
  setToken: async function (token: string): Promise<void> {
    await setSecret(TOKEN_KEY, token);
  },
  getToken: async function (): Promise<string | null> {
    return getSecret(TOKEN_KEY);
  },
  removeToken: async function (): Promise<void> {
    await deleteSecret(TOKEN_KEY);
  },
  saveProfileImage: async function (uri: string): Promise<void> {
    await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
  },
  getProfileImage: async function (): Promise<string | null> {
    return await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
  },
  clearProfileImage: async function (): Promise<void> {
    await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
  },
  setPushToken: async function (token: string): Promise<void> {
    await setSecret(PUSH_TOKEN_KEY, token);
  },
  getPushToken: async function (): Promise<string | null> {
    return getSecret(PUSH_TOKEN_KEY);
  },
  removePushToken: async function (): Promise<void> {
    await deleteSecret(PUSH_TOKEN_KEY);
  },
  clearAll: async function (): Promise<void> {
    // Wipe secrets from SecureStore and everything else from AsyncStorage.
    await deleteSecret(TOKEN_KEY);
    await deleteSecret(PUSH_TOKEN_KEY);
    await AsyncStorage.clear();
  },
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const PROFILE_IMAGE_KEY = 'profile_image';
const PUSH_TOKEN_KEY = 'push_token';

export const LocalStorage = {
  setToken: async function (token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },
  getToken: async function (): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },
  removeToken: async function (): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
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
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  },
  getPushToken: async function (): Promise<string | null> {
    return AsyncStorage.getItem(PUSH_TOKEN_KEY);
  },
  removePushToken: async function (): Promise<void> {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  },
  clearAll: async function (): Promise<void> {
    await AsyncStorage.clear();
  },
};

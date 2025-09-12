import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

export const LocalStorage = {
  setToken: async function(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }, 
  getToken: async function(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },
  removeToken: async function(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
  clearAll: async function(): Promise<void> {
    await AsyncStorage.clear();
  },
}

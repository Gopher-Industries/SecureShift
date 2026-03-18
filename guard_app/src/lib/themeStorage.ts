import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = '@theme_mode';

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
}

export async function loadThemeMode(): Promise<ThemeMode | null> {
  const value = await AsyncStorage.getItem(THEME_STORAGE_KEY);
  if (value === 'light' || value === 'dark') return value;
  return null;
}
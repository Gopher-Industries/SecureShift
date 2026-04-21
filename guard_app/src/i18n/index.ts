import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import zhCN from '../locales/zh-CN.json';
import zhTW from '../locales/zh-TW.json';

const STORE_LANGUAGE_KEY = 'settings.lang';

const resources = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
};

const languageDetectorPlugin = {
  type: 'languageDetector' as const,
  async: true,
  init: () => {},
  detect: async function (callback: (lang: string) => void) {
    try {
      // Get stored language from persistent storage
      const language = await AsyncStorage.getItem(STORE_LANGUAGE_KEY);
      if (language) {
        return callback(language);
      } else {
        // If no language is explicitly set, fallback to device locale
        const locales = Localization.getLocales();
        if (locales && locales.length > 0) {
          const deviceLang = locales[0].languageTag; // e.g. "zh-Hant-TW", "en-US"
          if (deviceLang.startsWith('zh')) {
            // map general chinese to tw or cn
            if (
              deviceLang.includes('Hant') ||
              deviceLang.includes('TW') ||
              deviceLang.includes('HK')
            ) {
              return callback('zh-TW');
            }
            return callback('zh-CN');
          }
          if (deviceLang.startsWith('en')) {
            return callback('en');
          }
        }
        return callback('en');
      }
    } catch (error) {
      console.log('Error reading language', error);
      return callback('en');
    }
  },
  cacheUserLanguage: async function (language: string) {
    try {
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
    } catch (error) {
      console.log('Error reading language', error);
    }
  },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources,
    compatibilityJSON: 'v4', // Required for React Native
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safeguards from xss
    },
    react: {
      useSuspense: false, // Prevents issues with React Native async loading
    },
  });

export default i18n;

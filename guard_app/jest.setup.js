/* eslint-env jest */

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// In-memory mock for expo-secure-store (no native keychain in Jest).
jest.mock('expo-secure-store', () => {
  let store = {};
  return {
    __reset: () => {
      store = {};
    },
    setItemAsync: jest.fn((key, value) => {
      store[key] = String(value);
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key) => Promise.resolve(key in store ? store[key] : null)),
    deleteItemAsync: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
  };
});

// Reset the SecureStore mock between tests so secrets don't leak across cases.
beforeEach(() => {
  jest.requireMock('expo-secure-store').__reset?.();
});

// Screens call t(key) without an initialized i18n instance in tests (by design,
// so assertions can match on the raw translation key). Silence the resulting
// react-i18next warning and the act() timing notices from state updates that
// land just after an awaited Alert — neither indicates a real test failure.
const NOISY_PATTERNS = ['NO_I18NEXT_INSTANCE', 'not wrapped in act'];

const originalWarn = console.warn;
const originalError = console.error;

const isNoisy = (args) => {
  const text = args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
  return NOISY_PATTERNS.some((pattern) => text.includes(pattern));
};

console.warn = (...args) => {
  if (isNoisy(args)) return;
  originalWarn(...args);
};

console.error = (...args) => {
  if (isNoisy(args)) return;
  originalError(...args);
};

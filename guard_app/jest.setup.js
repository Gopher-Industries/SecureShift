/* eslint-env jest */

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

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

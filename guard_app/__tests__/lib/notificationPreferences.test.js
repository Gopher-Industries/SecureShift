/* eslint-env jest */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { syncNotificationPreferences } from '../../src/api/notificationPreferences';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFS_STORAGE_KEY,
  NOTIFICATIONS_ENABLED_STORAGE_KEY,
  getNotificationCategory,
  getNotificationPreferences,
  setNotificationPreference,
  shouldDeliverNotification,
} from '../../src/lib/notificationPreferences';

jest.mock('../../src/api/notificationPreferences', () => ({
  syncNotificationPreferences: jest.fn(() => Promise.resolve()),
}));

let mockHandler;
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn((handler) => {
    mockHandler = handler;
  }),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
}));

const notificationWith = (data) => ({ request: { content: { data } } });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('getNotificationCategory', () => {
  it('maps backend notification types to categories', () => {
    expect(getNotificationCategory('SHIFT_APPROVED')).toBe('shiftAssignments');
    expect(getNotificationCategory('SHIFT_REJECTED')).toBe('shiftUpdates');
    expect(getNotificationCategory('MESSAGE')).toBe('messages');
    expect(getNotificationCategory('INCIDENT_REPORTED')).toBe('incidents');
  });

  it('leaves uncategorised and malformed types unmapped', () => {
    expect(getNotificationCategory('DOCUMENT_EXPIRING')).toBeNull();
    expect(getNotificationCategory(undefined)).toBeNull();
    expect(getNotificationCategory(42)).toBeNull();
  });
});

describe('preference persistence', () => {
  it('defaults every category to on', async () => {
    await expect(getNotificationPreferences()).resolves.toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('persists a toggled category and syncs it', async () => {
    const next = await setNotificationPreference('messages', false);

    expect(next).toEqual({ ...DEFAULT_NOTIFICATION_PREFERENCES, messages: false });
    expect(JSON.parse(await AsyncStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY))).toEqual(next);
    await expect(getNotificationPreferences()).resolves.toEqual(next);
    expect(syncNotificationPreferences).toHaveBeenCalledWith(next);
  });

  it('ignores corrupt or partial stored values', async () => {
    await AsyncStorage.setItem(NOTIFICATION_PREFS_STORAGE_KEY, '{"incidents":false,"bogus":1');
    await expect(getNotificationPreferences()).resolves.toEqual(DEFAULT_NOTIFICATION_PREFERENCES);

    await AsyncStorage.setItem(
      NOTIFICATION_PREFS_STORAGE_KEY,
      JSON.stringify({ incidents: false, messages: 'no' }),
    );
    await expect(getNotificationPreferences()).resolves.toEqual({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      incidents: false,
    });
  });
});

describe('shouldDeliverNotification', () => {
  it('suppresses muted categories and allows the rest', async () => {
    await setNotificationPreference('shiftAssignments', false);

    await expect(shouldDeliverNotification({ type: 'SHIFT_APPROVED' })).resolves.toBe(false);
    await expect(shouldDeliverNotification({ type: 'MESSAGE' })).resolves.toBe(true);
  });

  it('always delivers uncategorised notifications', async () => {
    for (const category of Object.keys(DEFAULT_NOTIFICATION_PREFERENCES)) {
      await setNotificationPreference(category, false);
    }

    await expect(shouldDeliverNotification({ type: 'DOCUMENT_EXPIRING' })).resolves.toBe(true);
    await expect(shouldDeliverNotification(undefined)).resolves.toBe(true);
  });

  it('suppresses everything when the master switch is off', async () => {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_STORAGE_KEY, 'false');

    await expect(shouldDeliverNotification({ type: 'MESSAGE' })).resolves.toBe(false);
    await expect(shouldDeliverNotification({ type: 'DOCUMENT_EXPIRING' })).resolves.toBe(false);
  });
});

describe('notification handler', () => {
  beforeAll(() => {
    // Registers the handler as a side effect of import.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    require('../../src/utils/notificationHelpers');
  });

  it('hides banner, list and sound for a muted category', async () => {
    await setNotificationPreference('incidents', false);

    await expect(
      mockHandler.handleNotification(notificationWith({ type: 'INCIDENT_REPORTED' })),
    ).resolves.toEqual({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  });

  it('shows notifications for enabled categories', async () => {
    await expect(
      mockHandler.handleNotification(notificationWith({ type: 'INCIDENT_REPORTED' })),
    ).resolves.toMatchObject({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
    });
  });
});

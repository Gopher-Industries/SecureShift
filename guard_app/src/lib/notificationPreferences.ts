import AsyncStorage from '@react-native-async-storage/async-storage';

import { syncNotificationPreferences } from '../api/notificationPreferences';

// Per-category notification opt-in/mute.
//
// Interim: preferences live on-device (AsyncStorage) and are enforced by the
// client notification handler, which only covers notifications the app gets to
// handle (foreground pushes + local notifications). Pushes the OS displays while
// the app is backgrounded/killed can only be filtered server-side - see
// syncNotificationPreferences for the backend follow-up.

export const NOTIFICATION_CATEGORIES = [
  'shiftAssignments',
  'shiftUpdates',
  'messages',
  'incidents',
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationPreferences = Record<NotificationCategory, boolean>;

export const NOTIFICATION_PREFS_STORAGE_KEY = '@guard_notification_prefs_v1';
// Existing master switch in Settings; muting it silences every category.
export const NOTIFICATIONS_ENABLED_STORAGE_KEY = '@guard_notifications_enabled';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  shiftAssignments: true,
  shiftUpdates: true,
  messages: true,
  incidents: true,
};

// Backend Notification.type values (app-backend/src/models/Notification.js), plus
// types agreed with the push-notifications ticket that aren't emitted yet.
// Types not listed here (e.g. DOCUMENT_EXPIRING - compliance-critical) are
// always delivered and can only be silenced with the master switch.
const TYPE_TO_CATEGORY: Record<string, NotificationCategory> = {
  SHIFT_APPROVED: 'shiftAssignments',
  SHIFT_ASSIGNED: 'shiftAssignments',
  SHIFT_APPLIED: 'shiftUpdates',
  SHIFT_REJECTED: 'shiftUpdates',
  SHIFT_UPDATED: 'shiftUpdates',
  SHIFT_CANCELLED: 'shiftUpdates',
  MESSAGE: 'messages',
  INCIDENT_REPORTED: 'incidents',
};

export function getNotificationCategory(type: unknown): NotificationCategory | null {
  if (typeof type !== 'string') return null;
  return TYPE_TO_CATEGORY[type] ?? null;
}

function normalise(raw: unknown): NotificationPreferences {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  if (typeof raw !== 'object' || raw === null) return prefs;

  for (const category of NOTIFICATION_CATEGORIES) {
    const value = (raw as Record<string, unknown>)[category];
    if (typeof value === 'boolean') prefs[category] = value;
  }
  return prefs;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY);
    return normalise(stored ? JSON.parse(stored) : null);
  } catch (error) {
    console.warn('Failed to load notification preferences', error);
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export async function setNotificationPreference(
  category: NotificationCategory,
  enabled: boolean,
): Promise<NotificationPreferences> {
  const next = { ...(await getNotificationPreferences()), [category]: enabled };
  await AsyncStorage.setItem(NOTIFICATION_PREFS_STORAGE_KEY, JSON.stringify(next));
  void syncNotificationPreferences(next);
  return next;
}

async function notificationsEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_STORAGE_KEY)) !== 'false';
  } catch {
    return true;
  }
}

/**
 * Whether a notification payload ({ type, data }) should be surfaced to the guard,
 * given the master switch and their per-category preferences.
 */
export async function shouldDeliverNotification(rawData: unknown): Promise<boolean> {
  if (!(await notificationsEnabled())) return false;

  const type =
    typeof rawData === 'object' && rawData !== null
      ? (rawData as Record<string, unknown>).type
      : undefined;
  const category = getNotificationCategory(type);
  if (!category) return true;

  const prefs = await getNotificationPreferences();
  return prefs[category];
}

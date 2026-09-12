import * as Notifications from 'expo-notifications';

import { myShifts } from '../api/shifts';

import type { ShiftDto } from '../api/shifts';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';

// Notification types the backend currently emits (see app-backend Notification model).
// "MESSAGE" isn't emitted yet - shape agreed with the push-notifications ticket so this
// routing is ready when it lands.
const SHIFT_NOTIFICATION_TYPES = new Set(['SHIFT_APPLIED', 'SHIFT_APPROVED', 'SHIFT_REJECTED']);
const MESSAGE_CONTEXTS = new Set(['shift', 'general']);

export type DeepLinkTarget = {
  [Screen in keyof RootStackParamList]: {
    screen: Screen;
    params: RootStackParamList[Screen];
  };
}[keyof RootStackParamList];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

async function findShiftById(shiftId: string): Promise<ShiftDto | null> {
  try {
    const [current, past] = await Promise.all([myShifts(), myShifts('past')]);
    return [...current, ...past].find((shift) => shift._id === shiftId) ?? null;
  } catch (error) {
    console.warn('Deep link: failed to look up shift', error);
    return null;
  }
}

function buildMessageParams(data: Record<string, unknown>): RootStackParamList['Messages'] {
  const context = MESSAGE_CONTEXTS.has(data.context as string)
    ? (data.context as 'shift' | 'general')
    : undefined;

  const params: NonNullable<RootStackParamList['Messages']> = {
    context,
    shiftParticipantId: stringOrUndefined(data.shiftParticipantId),
    shiftParticipantName: stringOrUndefined(data.shiftParticipantName),
    shiftTitle: stringOrUndefined(data.shiftTitle),
    generalParticipantId: stringOrUndefined(data.generalParticipantId),
    generalParticipantName: stringOrUndefined(data.generalParticipantName),
  };

  return params;
}

/**
 * Turns a push/local notification payload into a screen + params to navigate to.
 * Returns null for anything unrecognised or malformed so callers can fall back to Home.
 */
export async function resolveDeepLinkTarget(rawData: unknown): Promise<DeepLinkTarget | null> {
  if (!isPlainObject(rawData)) return null;

  const type = stringOrUndefined(rawData.type);
  if (!type) return null;

  const data = isPlainObject(rawData.data) ? rawData.data : {};

  if (SHIFT_NOTIFICATION_TYPES.has(type)) {
    const shiftId = stringOrUndefined(data.shiftId);
    if (!shiftId) return null;

    const shift = await findShiftById(shiftId);
    if (!shift) return null;

    return { screen: 'ShiftDetails', params: { shift } };
  }

  if (type === 'INCIDENT_REPORTED') {
    return { screen: 'IncidentReports', params: undefined };
  }

  if (type === 'DOCUMENT_EXPIRING') {
    return { screen: 'Documents', params: undefined };
  }

  if (type === 'MESSAGE') {
    return { screen: 'Messages', params: buildMessageParams(data) };
  }

  return null;
}

function isNavigationSettled(
  navigation: NavigationContainerRefWithCurrent<RootStackParamList>,
): boolean {
  // Splash decides between Login/AppTabs on a timer; navigating during that window
  // would just get clobbered by its navigation.replace().
  return navigation.isReady() && navigation.getCurrentRoute()?.name !== 'Splash';
}

function waitForNavigationSettled(
  navigation: NavigationContainerRefWithCurrent<RootStackParamList>,
  timeoutMs = 10000,
  intervalMs = 150,
): Promise<void> {
  return new Promise((resolve) => {
    if (isNavigationSettled(navigation)) {
      resolve();
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      if (isNavigationSettled(navigation) || Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve();
      }
    }, intervalMs);
  });
}

/**
 * Resolves a notification payload and navigates there, falling back to Home
 * (AppTabs) when the payload is unknown/invalid or the target can't be found.
 */
export async function navigateFromNotificationData(
  navigation: NavigationContainerRefWithCurrent<RootStackParamList>,
  rawData: unknown,
): Promise<void> {
  const target = await resolveDeepLinkTarget(rawData).catch((error) => {
    console.warn('Deep link: failed to resolve target', error);
    return null;
  });

  await waitForNavigationSettled(navigation);

  // react-navigation's overloaded `navigate` can't be called generically with a
  // screen name resolved at runtime; the screen/params pairing is validated by
  // `DeepLinkTarget` above.
  const navigate = navigation.navigate as (screen: string, params?: unknown) => void;

  if (target) {
    navigate(target.screen, target.params);
  } else {
    navigate('AppTabs');
  }
}

/**
 * Wires up cold-start (app opened by tapping a notification) and
 * background/foreground (app already running) deep-link handling.
 */
export function registerNotificationDeepLinking(
  navigation: NavigationContainerRefWithCurrent<RootStackParamList>,
) {
  const handleResponse = (response: Notifications.NotificationResponse) => {
    void navigateFromNotificationData(navigation, response.notification.request.content.data);
  };

  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) handleResponse(response);
    })
    .catch((error) => {
      console.warn('Deep link: failed to read last notification response', error);
    });

  return Notifications.addNotificationResponseReceivedListener(handleResponse);
}

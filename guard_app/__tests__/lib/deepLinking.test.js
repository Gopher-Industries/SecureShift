/* eslint-env jest */

import * as Notifications from 'expo-notifications';

import { myShifts } from '../../src/api/shifts';
import {
  navigateFromNotificationData,
  registerNotificationDeepLinking,
  resolveDeepLinkTarget,
} from '../../src/lib/deepLinking';

jest.mock('../../src/api/shifts', () => ({
  myShifts: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

const assignedShift = { _id: 'shift-1', title: 'Warehouse Gate Security', status: 'assigned' };
const pastShift = { _id: 'shift-2', title: 'Evening Event Security', status: 'completed' };

const flushPromises = async (times = 5) => {
  for (let i = 0; i < times; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};

function makeNavigation({ ready = true, currentRoute = 'AppTabs' } = {}) {
  return {
    isReady: jest.fn(() => ready),
    getCurrentRoute: jest.fn(() => (currentRoute ? { name: currentRoute } : undefined)),
    navigate: jest.fn(),
  };
}

describe('resolveDeepLinkTarget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    myShifts.mockImplementation((status) =>
      Promise.resolve(status === 'past' ? [pastShift] : [assignedShift]),
    );
  });

  it('routes a shift-approved payload to ShiftDetails with the resolved shift', async () => {
    const target = await resolveDeepLinkTarget({
      type: 'SHIFT_APPROVED',
      data: { shiftId: 'shift-1' },
    });

    expect(target).toEqual({ screen: 'ShiftDetails', params: { shift: assignedShift } });
  });

  it('finds shifts from shift history too', async () => {
    const target = await resolveDeepLinkTarget({
      type: 'SHIFT_APPLIED',
      data: { shiftId: 'shift-2' },
    });

    expect(target).toEqual({ screen: 'ShiftDetails', params: { shift: pastShift } });
  });

  it('falls back to null when the referenced shift cannot be found', async () => {
    const target = await resolveDeepLinkTarget({
      type: 'SHIFT_REJECTED',
      data: { shiftId: 'does-not-exist' },
    });

    expect(target).toBeNull();
  });

  it('routes an incident-reported payload to the incident reports screen', async () => {
    const target = await resolveDeepLinkTarget({
      type: 'INCIDENT_REPORTED',
      data: { incidentId: 'incident-1' },
    });

    expect(target).toEqual({ screen: 'IncidentReports', params: undefined });
  });

  it('routes a document-expiring payload to the documents screen', async () => {
    const target = await resolveDeepLinkTarget({ type: 'DOCUMENT_EXPIRING', data: {} });

    expect(target).toEqual({ screen: 'Documents', params: undefined });
  });

  it('routes a message payload to Messages with only the recognised fields', async () => {
    const target = await resolveDeepLinkTarget({
      type: 'MESSAGE',
      data: {
        context: 'shift',
        shiftParticipantId: 'user-1',
        shiftParticipantName: 'Noah Williams',
        shiftTitle: 'Warehouse Gate Security',
        unexpectedField: 'ignored',
      },
    });

    expect(target).toEqual({
      screen: 'Messages',
      params: {
        context: 'shift',
        shiftParticipantId: 'user-1',
        shiftParticipantName: 'Noah Williams',
        shiftTitle: 'Warehouse Gate Security',
        generalParticipantId: undefined,
        generalParticipantName: undefined,
      },
    });
  });

  it.each([
    ['an unknown type', { type: 'SOMETHING_NEW', data: {} }],
    ['a missing type', { data: { shiftId: 'shift-1' } }],
    ['a non-string type', { type: 42 }],
    ['a null payload', null],
    ['a string payload', 'SHIFT_APPROVED'],
    ['an array payload', ['SHIFT_APPROVED']],
    ['a shift payload with no shiftId', { type: 'SHIFT_APPROVED', data: {} }],
  ])('falls back to null for %s', async (_name, payload) => {
    expect(await resolveDeepLinkTarget(payload)).toBeNull();
  });
});

describe('navigateFromNotificationData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    myShifts.mockImplementation((status) =>
      Promise.resolve(status === 'past' ? [] : [assignedShift]),
    );
  });

  it('navigates straight to the resolved screen once navigation is ready', async () => {
    const navigation = makeNavigation();

    await navigateFromNotificationData(navigation, {
      type: 'SHIFT_APPROVED',
      data: { shiftId: 'shift-1' },
    });

    expect(navigation.navigate).toHaveBeenCalledWith('ShiftDetails', { shift: assignedShift });
  });

  it('falls back to Home for an unrecognised payload', async () => {
    const navigation = makeNavigation();

    await navigateFromNotificationData(navigation, { type: 'MYSTERY' });

    expect(navigation.navigate).toHaveBeenCalledWith('AppTabs');
  });

  it('waits until the app has left the cold-start Splash screen before navigating', async () => {
    jest.useFakeTimers();

    const navigation = makeNavigation({ ready: true, currentRoute: 'Splash' });
    const navigatePromise = navigateFromNotificationData(navigation, {
      type: 'INCIDENT_REPORTED',
    });

    // Still on Splash - must not navigate yet.
    await Promise.resolve();
    await Promise.resolve();
    expect(navigation.navigate).not.toHaveBeenCalled();

    // Splash finishes its auth check and lands on AppTabs.
    navigation.getCurrentRoute.mockReturnValue({ name: 'AppTabs' });
    await jest.advanceTimersByTimeAsync(150);

    await navigatePromise;
    expect(navigation.navigate).toHaveBeenCalledWith('IncidentReports', undefined);

    jest.useRealTimers();
  });
});

describe('registerNotificationDeepLinking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    myShifts.mockImplementation((status) =>
      Promise.resolve(status === 'past' ? [] : [assignedShift]),
    );
    Notifications.addNotificationResponseReceivedListener.mockReturnValue({
      remove: jest.fn(),
    });
  });

  it('deep-links from a cold start using the last notification response', async () => {
    Notifications.getLastNotificationResponseAsync.mockResolvedValue({
      notification: { request: { content: { data: { type: 'INCIDENT_REPORTED' } } } },
    });

    const navigation = makeNavigation();
    registerNotificationDeepLinking(navigation);

    await flushPromises();

    expect(navigation.navigate).toHaveBeenCalledWith('IncidentReports', undefined);
  });

  it('does nothing on cold start when the app was not opened from a notification', async () => {
    Notifications.getLastNotificationResponseAsync.mockResolvedValue(null);

    const navigation = makeNavigation();
    registerNotificationDeepLinking(navigation);

    await flushPromises();

    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('deep-links when a notification is tapped while the app is backgrounded', async () => {
    Notifications.getLastNotificationResponseAsync.mockResolvedValue(null);

    let backgroundHandler;
    Notifications.addNotificationResponseReceivedListener.mockImplementation((handler) => {
      backgroundHandler = handler;
      return { remove: jest.fn() };
    });

    const navigation = makeNavigation();
    registerNotificationDeepLinking(navigation);

    backgroundHandler({
      notification: {
        request: { content: { data: { type: 'SHIFT_APPROVED', data: { shiftId: 'shift-1' } } } },
      },
    });

    await flushPromises();

    expect(navigation.navigate).toHaveBeenCalledWith('ShiftDetails', { shift: assignedShift });
  });
});

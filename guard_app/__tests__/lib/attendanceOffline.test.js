/* eslint-env jest */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosError } from 'axios';

import { checkIn, checkOut } from '../../src/api/attendance';
import {
  enqueueAttendance,
  getQueue,
  getQueueCount,
  getPendingForShift,
} from '../../src/lib/attendanceQueue';
import { syncPendingAttendance } from '../../src/lib/attendanceSync';
import { getIsConnected } from '../../src/lib/networkStatus';

jest.mock('../../src/api/attendance', () => ({
  checkIn: jest.fn(),
  checkOut: jest.fn(),
}));

jest.mock('../../src/lib/networkStatus', () => ({
  getIsConnected: jest.fn(),
}));

const loc = { latitude: -37.8, longitude: 144.9, timestamp: 1_700_000_000_000 };

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  getIsConnected.mockResolvedValue(true);
});

describe('attendanceQueue', () => {
  it('enqueues actions and counts them', async () => {
    await enqueueAttendance({ shiftId: 's1', type: 'check-in', location: loc });
    await enqueueAttendance({ shiftId: 's2', type: 'check-in', location: loc });
    expect(await getQueueCount()).toBe(2);
  });

  it('dedupes the same shift + type (latest wins)', async () => {
    await enqueueAttendance({ shiftId: 's1', type: 'check-in', location: loc });
    await enqueueAttendance({
      shiftId: 's1',
      type: 'check-in',
      location: { ...loc, timestamp: 999 },
    });
    const q = await getQueue();
    expect(q).toHaveLength(1);
    expect(q[0].location.timestamp).toBe(999);
  });

  it('keeps check-in and check-out for the same shift separate', async () => {
    await enqueueAttendance({ shiftId: 's1', type: 'check-in', location: loc });
    await enqueueAttendance({ shiftId: 's1', type: 'check-out', location: loc });
    expect(await getPendingForShift('s1')).toHaveLength(2);
  });
});

describe('syncPendingAttendance', () => {
  it('replays queued actions and clears them on success', async () => {
    await enqueueAttendance({ shiftId: 's1', type: 'check-in', location: loc });
    checkIn.mockResolvedValue({ attendance: { checkInTime: '2026-01-01T00:00:00.000Z' } });

    const result = await syncPendingAttendance();

    expect(checkIn).toHaveBeenCalledWith('s1', loc);
    expect(result.synced).toBe(1);
    expect(result.remaining).toBe(0);
    expect(await getQueueCount()).toBe(0);
  });

  it('does nothing while offline (keeps the queue)', async () => {
    await enqueueAttendance({ shiftId: 's1', type: 'check-out', location: loc });
    getIsConnected.mockResolvedValue(false);

    const result = await syncPendingAttendance();

    expect(checkOut).not.toHaveBeenCalled();
    expect(result.synced).toBe(0);
    expect(result.remaining).toBe(1);
  });

  it('stops and keeps items on a connectivity failure', async () => {
    await enqueueAttendance({ shiftId: 's1', type: 'check-in', location: loc });
    checkIn.mockRejectedValue(new AxiosError('Network Error')); // no response

    const result = await syncPendingAttendance();

    expect(result.synced).toBe(0);
    expect(result.remaining).toBe(1); // kept for retry
  });

  it('drops an item the server definitively rejects (already checked in)', async () => {
    await enqueueAttendance({ shiftId: 's1', type: 'check-in', location: loc });
    const rejection = new AxiosError('bad');
    rejection.response = { data: { message: 'Already checked in' } };
    checkIn.mockRejectedValue(rejection);

    const result = await syncPendingAttendance();

    expect(result.failed).toBe(1);
    expect(result.remaining).toBe(0); // dropped, doesn't block the queue
  });
});

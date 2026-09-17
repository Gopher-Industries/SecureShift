/* eslint-env jest */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosError } from 'axios';

import { getMockCheckpoints, submitCheckpointScan } from '../../src/api/patrol';
import { checkWithinRadius, formatDistance, haversineMeters } from '../../src/lib/geo';
import { getIsConnected } from '../../src/lib/networkStatus';
import {
  enqueueScan,
  getPendingForShift,
  getQueue,
  getQueueCount,
} from '../../src/lib/patrolQueue';
import { syncPendingScans } from '../../src/lib/patrolSync';
import { verifyScan } from '../../src/lib/patrolVerify';

jest.mock('../../src/api/patrol', () => {
  const actual = jest.requireActual('../../src/api/patrol');
  return { ...actual, submitCheckpointScan: jest.fn() };
});

jest.mock('../../src/lib/networkStatus', () => ({
  getIsConnected: jest.fn(),
}));

const BASE = { latitude: -34.9285, longitude: 138.6007 };
const SYDNEY = { latitude: -33.8688, longitude: 151.2093 };
const loc = { latitude: BASE.latitude, longitude: BASE.longitude, timestamp: 1_700_000_000_000 };

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  getIsConnected.mockResolvedValue(true);
});

describe('geo', () => {
  it('returns 0 distance for identical points', () => {
    expect(haversineMeters(BASE, BASE)).toBeCloseTo(0, 5);
  });

  it('measures ~44 m for a 0.0004° latitude offset', () => {
    const d = haversineMeters(BASE, { ...BASE, latitude: BASE.latitude + 0.0004 });
    expect(d).toBeGreaterThan(40);
    expect(d).toBeLessThan(50);
  });

  it('checkWithinRadius passes when close, fails when far', () => {
    expect(checkWithinRadius(BASE, BASE, 150).within).toBe(true);
    expect(checkWithinRadius(BASE, SYDNEY, 150).within).toBe(false);
  });

  it('formats distances', () => {
    expect(formatDistance(45)).toBe('45 m');
    expect(formatDistance(1250)).toBe('1.3 km');
  });
});

describe('verifyScan (QR + GPS)', () => {
  const cps = getMockCheckpoints('s1');

  it('accepts a matching code within range', () => {
    const r = verifyScan('SS-CP-01', cps, BASE);
    expect(r.ok).toBe(true);
  });

  it('is case/space insensitive on the code', () => {
    expect(verifyScan('  ss-cp-02 ', cps, BASE).ok).toBe(true);
  });

  it('rejects an unknown code', () => {
    expect(verifyScan('NOPE', cps, BASE)).toEqual({ ok: false, reason: 'unknown-code' });
  });

  it('rejects a checkpoint already completed', () => {
    const r = verifyScan('SS-CP-01', cps, BASE, ['cp-01']);
    expect(r).toMatchObject({ ok: false, reason: 'already-done' });
  });

  it('rejects when out of range even with a valid code', () => {
    const r = verifyScan('SS-CP-01', cps, SYDNEY);
    expect(r).toMatchObject({ ok: false, reason: 'too-far' });
  });
});

describe('patrolQueue', () => {
  it('enqueues distinct checkpoints and counts them', async () => {
    await enqueueScan({ shiftId: 's1', checkpointId: 'cp-01', code: 'SS-CP-01', location: loc });
    await enqueueScan({ shiftId: 's1', checkpointId: 'cp-02', code: 'SS-CP-02', location: loc });
    expect(await getQueueCount()).toBe(2);
  });

  it('dedupes the same shift + checkpoint (latest wins)', async () => {
    await enqueueScan({ shiftId: 's1', checkpointId: 'cp-01', code: 'SS-CP-01', location: loc });
    await enqueueScan({
      shiftId: 's1',
      checkpointId: 'cp-01',
      code: 'SS-CP-01',
      location: { ...loc, timestamp: 999 },
    });
    const q = await getQueue();
    expect(q).toHaveLength(1);
    expect(q[0].location.timestamp).toBe(999);
  });

  it('filters pending scans by shift', async () => {
    await enqueueScan({ shiftId: 's1', checkpointId: 'cp-01', code: 'SS-CP-01', location: loc });
    await enqueueScan({ shiftId: 's2', checkpointId: 'cp-01', code: 'SS-CP-01', location: loc });
    expect(await getPendingForShift('s1')).toHaveLength(1);
  });
});

describe('syncPendingScans', () => {
  it('replays queued scans and clears them on success', async () => {
    await enqueueScan({ shiftId: 's1', checkpointId: 'cp-01', code: 'SS-CP-01', location: loc });
    submitCheckpointScan.mockResolvedValue({
      checkpointId: 'cp-01',
      scannedAt: '2026-01-01T00:00:00.000Z',
      latitude: loc.latitude,
      longitude: loc.longitude,
    });

    const result = await syncPendingScans();

    expect(submitCheckpointScan).toHaveBeenCalledTimes(1);
    expect(result.synced).toBe(1);
    expect(result.remaining).toBe(0);
    expect(await getQueueCount()).toBe(0);
  });

  it('does nothing while offline (keeps the queue)', async () => {
    await enqueueScan({ shiftId: 's1', checkpointId: 'cp-01', code: 'SS-CP-01', location: loc });
    getIsConnected.mockResolvedValue(false);

    const result = await syncPendingScans();

    expect(submitCheckpointScan).not.toHaveBeenCalled();
    expect(result.remaining).toBe(1);
  });

  it('keeps items on a connectivity failure', async () => {
    await enqueueScan({ shiftId: 's1', checkpointId: 'cp-01', code: 'SS-CP-01', location: loc });
    submitCheckpointScan.mockRejectedValue(new AxiosError('Network Error')); // no response

    const result = await syncPendingScans();

    expect(result.synced).toBe(0);
    expect(result.remaining).toBe(1);
  });

  it('drops an item the server definitively rejects', async () => {
    await enqueueScan({ shiftId: 's1', checkpointId: 'cp-01', code: 'SS-CP-01', location: loc });
    const rejection = new AxiosError('bad');
    rejection.response = { data: { message: 'Checkpoint closed' } };
    submitCheckpointScan.mockRejectedValue(rejection);

    const result = await syncPendingScans();

    expect(result.failed).toBe(1);
    expect(result.remaining).toBe(0);
  });
});

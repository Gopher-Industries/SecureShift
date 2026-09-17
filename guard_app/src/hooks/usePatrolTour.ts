// Drives the Guard Tour / Patrol experience for a single shift: loads the
// checkpoints, tracks which are done (persisted locally + optimistic), records a
// scan (GPS + QR verification, online or queued offline), and flushes the
// offline queue when connectivity returns.
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  getCheckpoints,
  submitCheckpointScan,
  type Checkpoint,
  type CheckpointScan,
} from '../api/patrol';
import i18n from '../i18n';
import { getCurrentLocation, LocationError } from '../lib/currentLocation';
import { getIsConnected, useNetworkStatus } from '../lib/networkStatus';
import { enqueueScan, getPendingForShift } from '../lib/patrolQueue';
import { getShiftProgress, setCheckpointDone } from '../lib/patrolStore';
import { syncPendingScans } from '../lib/patrolSync';
import { verifyScan } from '../lib/patrolVerify';

export type ScanOutcome =
  | { status: 'success'; offline: boolean; checkpoint: Checkpoint }
  | { status: 'unknown-code' }
  | { status: 'already-done'; checkpoint: Checkpoint }
  | { status: 'too-far'; checkpoint: Checkpoint; distanceMeters: number }
  | { status: 'location-error'; message: string }
  | { status: 'server-error'; message: string };

export function usePatrolTour(shiftId: string) {
  const { isConnected, justReconnected } = useNetworkStatus();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [progress, setProgress] = useState<Record<string, CheckpointScan>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPending = useCallback(async () => {
    setPendingCount((await getPendingForShift(shiftId)).length);
  }, [shiftId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cps, prog] = await Promise.all([getCheckpoints(shiftId), getShiftProgress(shiftId)]);
      cps.sort((a, b) => a.order - b.order);
      setCheckpoints(cps);
      setProgress(prog);
    } catch {
      setError(i18n.t('patrol.loadError'));
    } finally {
      setLoading(false);
      await refreshPending();
    }
  }, [shiftId, refreshPending]);

  const flush = useCallback(async () => {
    await syncPendingScans();
    setProgress(await getShiftProgress(shiftId));
    await refreshPending();
  }, [shiftId, refreshPending]);

  useEffect(() => {
    void load();
  }, [load]);

  // Flush the offline queue on reconnect and when the app is foregrounded.
  useEffect(() => {
    if (justReconnected) void flush();
  }, [justReconnected, flush]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void flush();
    });
    return () => sub.remove();
  }, [flush]);

  const markDoneLocally = useCallback(async (shift: string, scan: CheckpointScan) => {
    await setCheckpointDone(shift, scan).catch(() => {});
    setProgress((prev) => ({ ...prev, [scan.checkpointId]: scan }));
  }, []);

  // Verify + record a scanned QR payload. Captures GPS, checks the guard is at
  // the checkpoint, then submits online or queues offline.
  const recordScan = useCallback(
    async (rawCode: string): Promise<ScanOutcome> => {
      let loc;
      try {
        loc = await getCurrentLocation();
      } catch (e) {
        const message = e instanceof LocationError ? e.message : i18n.t('patrol.locationGeneric');
        return { status: 'location-error', message };
      }

      const completedIds = Object.keys(progress);
      const result = verifyScan(
        rawCode,
        checkpoints,
        { latitude: loc.latitude, longitude: loc.longitude },
        completedIds,
      );

      if (!result.ok) {
        if (result.reason === 'unknown-code') return { status: 'unknown-code' };
        if (result.reason === 'already-done') {
          return { status: 'already-done', checkpoint: result.checkpoint };
        }
        return {
          status: 'too-far',
          checkpoint: result.checkpoint,
          distanceMeters: result.distanceMeters,
        };
      }

      const { checkpoint } = result;
      const timestamp = loc.timestamp ?? Date.now();
      const optimistic: CheckpointScan = {
        checkpointId: checkpoint.id,
        scannedAt: new Date(timestamp).toISOString(),
        latitude: loc.latitude,
        longitude: loc.longitude,
      };

      const online = await getIsConnected();
      if (online) {
        try {
          const scan = await submitCheckpointScan({
            shiftId,
            checkpointId: checkpoint.id,
            code: checkpoint.code,
            latitude: loc.latitude,
            longitude: loc.longitude,
            timestamp,
          });
          await markDoneLocally(shiftId, scan);
          return { status: 'success', offline: false, checkpoint };
        } catch (e) {
          // Server received and rejected it -> surface the error.
          if (axios.isAxiosError(e) && e.response) {
            const message = e.response?.data?.message ?? i18n.t('patrol.serverRejected');
            return { status: 'server-error', message };
          }
          // Connectivity failure -> queue and optimistically mark done.
        }
      }

      await enqueueScan({
        shiftId,
        checkpointId: checkpoint.id,
        code: checkpoint.code,
        location: { latitude: loc.latitude, longitude: loc.longitude, timestamp },
      });
      await markDoneLocally(shiftId, optimistic);
      await refreshPending();
      return { status: 'success', offline: true, checkpoint };
    },
    [shiftId, checkpoints, progress, markDoneLocally, refreshPending],
  );

  const completedCount = checkpoints.filter((cp) => progress[cp.id]).length;
  const total = checkpoints.length;
  const isComplete = total > 0 && completedCount === total;

  return {
    loading,
    error,
    checkpoints,
    progress,
    completedCount,
    total,
    isComplete,
    pendingCount,
    isConnected,
    recordScan,
    reload: load,
    syncNow: flush,
  };
}

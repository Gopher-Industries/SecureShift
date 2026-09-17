// Replays queued checkpoint scans against the backend when the device is back
// online. Safe to call repeatedly (no-op when the queue is empty or offline);
// runs oldest-first. Mirrors the attendance sync used by GA-029.
import axios from 'axios';

import { getIsConnected } from './networkStatus';
import { getQueue, removeFromQueue, type PendingScan } from './patrolQueue';
import { setCheckpointDone } from './patrolStore';
import { submitCheckpointScan, type CheckpointScan } from '../api/patrol';

export type SyncResult = {
  synced: number;
  failed: number;
  remaining: number;
};

let syncing = false;

// A definitive HTTP rejection means the server received the scan and refused it
// (retrying won't help). A missing response means we never reached the server.
function isServerRejection(error: unknown): boolean {
  return axios.isAxiosError(error) && Boolean(error.response);
}

async function replayOne(item: PendingScan): Promise<CheckpointScan> {
  return submitCheckpointScan({
    shiftId: item.shiftId,
    checkpointId: item.checkpointId,
    code: item.code,
    latitude: item.location.latitude,
    longitude: item.location.longitude,
    timestamp: item.location.timestamp ?? Date.now(),
  });
}

export async function syncPendingScans(): Promise<SyncResult> {
  if (syncing) return { synced: 0, failed: 0, remaining: await queueLength() };
  syncing = true;

  try {
    const queue = await getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0, remaining: 0 };

    if (!(await getIsConnected())) {
      return { synced: 0, failed: 0, remaining: queue.length };
    }

    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        const scan = await replayOne(item);
        await setCheckpointDone(item.shiftId, scan).catch(() => {});
        await removeFromQueue(item.id);
        synced += 1;
      } catch (error) {
        if (isServerRejection(error)) {
          // Server refused it (e.g. checkpoint closed / duplicate) — drop it so
          // it doesn't block the rest of the queue.
          await removeFromQueue(item.id);
          failed += 1;
        } else {
          // Connectivity failure — stop and keep the rest for the next attempt.
          break;
        }
      }
    }

    return { synced, failed, remaining: await queueLength() };
  } finally {
    syncing = false;
  }
}

async function queueLength(): Promise<number> {
  return (await getQueue()).length;
}

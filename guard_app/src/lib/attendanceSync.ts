// Replays queued offline attendance actions against the backend when the
// device is back online. Safe to call repeatedly (it's a no-op when the queue
// is empty or the device is offline) and it runs actions oldest-first.
import axios from 'axios';

import { getQueue, removeFromQueue, type PendingAttendance } from './attendanceQueue';
import { setAttendanceForShift } from './attendancestore';
import { getIsConnected } from './networkStatus';
import { checkIn, checkOut } from '../api/attendance';

export type SyncResult = {
  synced: number;
  failed: number;
  remaining: number;
};

let syncing = false;

// True when the server responded with a definitive rejection (a real HTTP
// status). A missing response means the request never reached the server
// (still offline / transient), so we should keep the item and retry later.
function isServerRejection(error: unknown): boolean {
  return axios.isAxiosError(error) && Boolean(error.response);
}

function serverMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return String(error.response?.data?.message ?? error.message ?? '');
  }
  return error instanceof Error ? error.message : '';
}

async function replayOne(item: PendingAttendance): Promise<void> {
  const res =
    item.type === 'check-in'
      ? await checkIn(item.shiftId, item.location)
      : await checkOut(item.shiftId, item.location);

  // Persist the server's authoritative times so the local map matches.
  await setAttendanceForShift(item.shiftId, {
    checkInTime: res.attendance?.checkInTime ?? undefined,
    checkOutTime: res.attendance?.checkOutTime ?? undefined,
  }).catch(() => {});
}

// Drains the queue. Stops early on the first connectivity failure (we're still
// offline); drops items the server definitively rejects (e.g. "already checked
// in") since retrying them will never succeed.
export async function syncPendingAttendance(): Promise<SyncResult> {
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
        await replayOne(item);
        await removeFromQueue(item.id);
        synced += 1;
      } catch (error) {
        if (isServerRejection(error)) {
          // The backend rejected it outright (e.g. already checked in, or
          // outside the window). Retrying won't help — drop it so it doesn't
          // block the rest of the queue.
          const msg = serverMessage(error).toLowerCase();
          if (msg.includes('already checked in') || msg.includes('already checked out')) {
            // Intended state already exists; reflect it locally.
            await setAttendanceForShift(item.shiftId, {
              checkInTime:
                item.type === 'check-in'
                  ? item.location.timestamp
                    ? new Date(item.location.timestamp).toISOString()
                    : undefined
                  : undefined,
              checkOutTime:
                item.type === 'check-out' && item.location.timestamp
                  ? new Date(item.location.timestamp).toISOString()
                  : undefined,
            }).catch(() => {});
          }
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

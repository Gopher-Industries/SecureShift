// Persistent queue of checkpoint scans captured while offline (or that failed to
// reach the server). Each entry keeps the QR code, GPS fix and timestamp from
// the moment of the scan so the backend records the true patrol time on replay.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LocationPayload } from '../api/attendance';

export type PendingScan = {
  id: string;
  shiftId: string;
  checkpointId: string;
  code: string;
  location: LocationPayload;
  queuedAt: string;
};

const KEY = 'patrol_pending_queue';

export async function getQueue(): Promise<PendingScan[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingScan[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingScan[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(queue));
}

// Queue a scan. If an unsynced scan for the same shift + checkpoint already
// exists it is replaced (latest wins) so a double-scan doesn't double-submit.
export async function enqueueScan(
  scan: Omit<PendingScan, 'id' | 'queuedAt'>,
): Promise<PendingScan> {
  const queue = await getQueue();
  const entry: PendingScan = {
    ...scan,
    id: `${scan.shiftId}-${scan.checkpointId}-${Date.now()}`,
    queuedAt: new Date().toISOString(),
  };
  const deduped = queue.filter(
    (item) => !(item.shiftId === scan.shiftId && item.checkpointId === scan.checkpointId),
  );
  deduped.push(entry);
  await writeQueue(deduped);
  return entry;
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  await writeQueue(queue.filter((item) => item.id !== id));
}

export async function getQueueCount(): Promise<number> {
  return (await getQueue()).length;
}

export async function getPendingForShift(shiftId: string): Promise<PendingScan[]> {
  const queue = await getQueue();
  return queue.filter((item) => item.shiftId === shiftId);
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

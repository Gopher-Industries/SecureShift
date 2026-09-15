// Persistent queue of attendance actions (check-in / check-out) that were made
// while offline (or that failed to reach the server due to connectivity).
//
// Each entry captures the location AND the timestamp at the moment the guard
// acted, so when it is later replayed the backend records the real time of the
// check-in/out rather than the sync time.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LocationPayload } from '../api/attendance';

export type AttendanceAction = 'check-in' | 'check-out';

export type PendingAttendance = {
  id: string;
  shiftId: string;
  type: AttendanceAction;
  location: LocationPayload;
  queuedAt: string;
};

const KEY = 'attendance_pending_queue';

export async function getQueue(): Promise<PendingAttendance[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingAttendance[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingAttendance[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(queue));
}

// Add an action to the end of the queue. If an unsynced action of the same
// type already exists for this shift, it is replaced (the latest wins) so a
// guard tapping twice offline does not double-submit.
export async function enqueueAttendance(
  action: Omit<PendingAttendance, 'id' | 'queuedAt'>,
): Promise<PendingAttendance> {
  const queue = await getQueue();

  const entry: PendingAttendance = {
    ...action,
    id: `${action.shiftId}-${action.type}-${Date.now()}`,
    queuedAt: new Date().toISOString(),
  };

  const deduped = queue.filter(
    (item) => !(item.shiftId === action.shiftId && item.type === action.type),
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

// Pending actions for one shift — used to show a "waiting to sync" hint on the
// shift screen.
export async function getPendingForShift(shiftId: string): Promise<PendingAttendance[]> {
  const queue = await getQueue();
  return queue.filter((item) => item.shiftId === shiftId);
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

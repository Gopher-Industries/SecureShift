// Local record of completed checkpoint scans, keyed by shift then checkpoint.
// Lets the patrol screen show progress instantly and offline (optimistically),
// independent of whether the scan has reached the server yet.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CheckpointScan } from '../api/patrol';

const KEY = 'patrol_progress';

type ProgressMap = Record<string, Record<string, CheckpointScan>>;

async function readAll(): Promise<ProgressMap> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as ProgressMap) : {};
  } catch {
    return {};
  }
}

async function writeAll(map: ProgressMap): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

// Completed scans for one shift, keyed by checkpointId.
export async function getShiftProgress(shiftId: string): Promise<Record<string, CheckpointScan>> {
  const all = await readAll();
  return all[shiftId] ?? {};
}

export async function setCheckpointDone(shiftId: string, scan: CheckpointScan): Promise<void> {
  const all = await readAll();
  const forShift = all[shiftId] ?? {};
  forShift[scan.checkpointId] = scan;
  all[shiftId] = forShift;
  await writeAll(all);
}

export async function clearShiftProgress(shiftId: string): Promise<void> {
  const all = await readAll();
  delete all[shiftId];
  await writeAll(all);
}

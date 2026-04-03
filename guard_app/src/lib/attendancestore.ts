// src/lib/attendancestore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

type AttendanceMap = Record<
  string,
  {
    checkInTime?: string;
    checkOutTime?: string;
  }
>;

const KEY = 'attendance_map';

/**
 * Get the entire attendance map from storage.
 */
export async function getAttendanceMap(): Promise<AttendanceMap> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AttendanceMap;
  } catch {
    return {};
  }
}

/**
 * Get attendance for a specific shift.
 */
export async function getAttendanceForShift(
  shiftId: string,
): Promise<{ checkInTime?: string; checkOutTime?: string } | null> {
  const map = await getAttendanceMap();
  return map[shiftId] ?? null;
}

/**
 * Save attendance state for a shift (used after check-in/out succeeds).
 */
export async function setAttendanceForShift(
  shiftId: string,
  data: { checkInTime?: string; checkOutTime?: string },
): Promise<void> {
  const map = await getAttendanceMap();
  map[shiftId] = {
    ...(map[shiftId] ?? {}),
    ...data,
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

/**
 * Optional helper if you ever want to clear (e.g., logout).
 */
export async function clearAttendanceMap(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

// Pure date / geo helpers for ShiftDetailsScreen (check-in/out validation).
// Extracted from ShiftDetailsScreen.tsx (GA-021) unchanged.

import type { ShiftDto } from '../api/shifts';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getShiftDateKey(shiftDateValue: string | Date) {
  const shiftDate = new Date(shiftDateValue);
  return formatLocalDateKey(shiftDate);
}

export function parseTimeToDate(baseDateValue: string | Date, timeValue?: string) {
  if (!timeValue) return null;

  const [hoursText, minutesText] = timeValue.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const baseDate = new Date(baseDateValue);
  baseDate.setHours(hours, minutes, 0, 0);
  return baseDate;
}

export function getShiftWindow(shiftDate: string | Date, startTime?: string, endTime?: string) {
  const start = parseTimeToDate(shiftDate, startTime);
  const end = parseTimeToDate(shiftDate, endTime);

  if (!start || !end) {
    return { start, end };
  }

  // Handle overnight shifts, e.g. 22:00 - 06:00
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

export function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceInMeters(a: Coordinates, b: Coordinates) {
  const earthRadius = 6371000;

  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);

  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadius * c;
}

export function getShiftCoordinates(shift: ShiftDto): Coordinates | null {
  const latitude = (shift.location as any)?.latitude;
  const longitude = (shift.location as any)?.longitude;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  return { latitude, longitude };
}

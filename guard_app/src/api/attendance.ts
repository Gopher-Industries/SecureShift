// src/api/attendance.ts
import http from '../lib/http';

export type Attendance = {
  _id: string;
  guardId: string;
  shiftId: string;
  checkInTime?: string;
  checkOutTime?: string;
  locationVerified: boolean;
};

type LocationPayload = {
  latitude: number;
  longitude: number;
  timestamp?: number;
};

export async function checkIn(shiftId: string, loc: LocationPayload) {
  const { data } = await http.post<{ message: string; attendance: Attendance }>(
    `/attendance/checkin/${shiftId}`,
    {
      latitude: loc.latitude,
      longitude: loc.longitude,
      timestamp: loc.timestamp,
    },
  );
  return data;
}

export async function checkOut(shiftId: string, loc: LocationPayload) {
  const { data } = await http.post<{ message: string; attendance: Attendance }>(
    `/attendance/checkout/${shiftId}`,
    {
      latitude: loc.latitude,
      longitude: loc.longitude,
      timestamp: loc.timestamp,
    },
  );
  return data;
}

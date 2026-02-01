// src/api/attendance.ts
import http from '../lib/http';

export type Attendance = {
  _id: string;
  guardId: string;

  // NOTE:
  // backend might return shiftId as a string OR a populated object
  shiftId: string | any;

  checkInTime?: string | null;
  checkOutTime?: string | null;
  locationVerified: boolean;

  createdAt?: string;
  updatedAt?: string;
};

export type LocationPayload = {
  latitude: number;
  longitude: number;
  timestamp?: number;
};

type AttendanceResponse = {
  message: string;
  attendance: Attendance;
};

// ✅ Check In
export async function checkIn(shiftId: string, loc: LocationPayload) {
  const { data } = await http.post<AttendanceResponse>(`/attendance/checkin/${shiftId}`, {
    latitude: loc.latitude,
    longitude: loc.longitude,
    timestamp: loc.timestamp,
  });
  return data;
}

// ✅ Check Out
export async function checkOut(shiftId: string, loc: LocationPayload) {
  const { data } = await http.post<AttendanceResponse>(`/attendance/checkout/${shiftId}`, {
    latitude: loc.latitude,
    longitude: loc.longitude,
    timestamp: loc.timestamp,
  });
  return data;
}

// ✅ Timesheets list (requires backend endpoint GET /attendance/my)
export async function getMyAttendance(params?: { from?: string; to?: string }) {
  const { data } = await http.get<{ items: Attendance[] }>(`/attendance/my`, { params });
  return data?.items ?? [];
}

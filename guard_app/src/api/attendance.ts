// src/api/attendance.ts
import axios from 'axios';

import http from '../lib/http';

export type Attendance = {
  _id: string;
  guardId: string;
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

type AttendanceListResponse =
  | Attendance[]
  | {
      items?: Attendance[];
      attendance?: Attendance[];
      data?: Attendance[];
      message?: string;
      count?: number;
    };

function normalizeAttendanceList(data: AttendanceListResponse): Attendance[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.attendance)) return data.attendance;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

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

// ✅ Timesheets list
export async function getUserAttendance(
  userId: string,
  params?: { from?: string; to?: string },
): Promise<Attendance[]> {
  if (!userId || userId === 'undefined' || userId === 'null') {
    throw new Error('Missing valid userId for attendance request');
  }

  try {
    const { data } = await http.get<AttendanceListResponse>(`/attendance/${userId}`, {
      params,
    });

    return normalizeAttendanceList(data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      // backend uses 404 for "no records yet"
      if (status === 404 && message === 'No attendance records found for this user') {
        return [];
      }

      throw new Error(message || `Failed to fetch attendance (${status ?? 'unknown'})`);
    }

    throw new Error('Failed to fetch attendance');
  }
}

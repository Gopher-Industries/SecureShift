import http from '../lib/http';

export type Attendance = {
  _id: string;
  guardId: string;
  shiftId: string;
  checkInTime?: string;
  checkOutTime?: string;
  locationVerified: boolean;
};

export async function checkIn(shiftId: string, latitude: number, longitude: number) {
  const { data } = await http.post<{ message: string; attendance: Attendance }>(
    `/attendance/checkin/${shiftId}`,
    { latitude, longitude },
  );
  return data;
}

export async function checkOut(shiftId: string, latitude: number, longitude: number) {
  const { data } = await http.post<{ message: string; attendance: Attendance }>(
    `/attendance/checkout/${shiftId}`,
    { latitude, longitude },
  );
  return data;
}

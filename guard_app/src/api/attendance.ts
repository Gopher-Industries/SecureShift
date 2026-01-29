import http from '../lib/http';

export type Attendance = {
  _id: string;
  guardId: string;
  shiftId: string;
  checkInTime?: string;
  checkOutTime?: string;
  locationVerified: boolean;
};

<<<<<<< Updated upstream
export async function checkIn(shiftId: string, latitude: number, longitude: number) {
  const { data } = await http.post<{ message: string; attendance: Attendance }>(
    `/attendance/checkin/${shiftId}`,
    { latitude, longitude },
=======
export async function checkIn(
  shiftId: string,
  latitude: number,
  longitude: number,
  timestamp?: number,
) {
  const { data } = await http.post<{ message: string; attendance: Attendance }>(
    `/attendance/checkin/${shiftId}`,
    { latitude, longitude, timestamp },
>>>>>>> Stashed changes
  );
  return data;
}

<<<<<<< Updated upstream
export async function checkOut(shiftId: string, latitude: number, longitude: number) {
  const { data } = await http.post<{ message: string; attendance: Attendance }>(
    `/attendance/checkout/${shiftId}`,
    { latitude, longitude },
=======
export async function checkOut(
  shiftId: string,
  latitude: number,
  longitude: number,
  timestamp?: number,
) {
  const { data } = await http.post<{ message: string; attendance: Attendance }>(
    `/attendance/checkout/${shiftId}`,
    { latitude, longitude, timestamp },
>>>>>>> Stashed changes
  );
  return data;
}

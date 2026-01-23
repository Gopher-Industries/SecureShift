import http from '../lib/http';
import { LocalStorage } from '../lib/localStorage';

export type Availability = {
  _id: string;
  user: string;
  days: string[];
  timeSlots: string[];
  updatedAt: string;
};

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function getMyAvailability(): Promise<Availability | null> {
  try {
    const token = await LocalStorage.getToken();
    if (!token) return null;

    const decoded = parseJwt(token);
    const userId = decoded?.id;
    if (!userId) return null;

    const { data } = await http.get<{ availability: Availability }>(`/availability/${userId}`);
    return data.availability || null;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      return null;
    }
    console.error('Error getting availability:', e);
    return null;
  }
}


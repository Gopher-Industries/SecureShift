import { UserProfile } from '../models/UserProfile';
import http from '../lib/http';

// Endpoints
const Endpoints = {
  usersMe: '/users/me',
} as const;

// APIs

// Get user profile
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data } = await http.get(Endpoints.usersMe); // Protected GET request with token
    return data;
  } catch (e) {
    console.error('Error getting user profile:', e);
    return null;
  }
}

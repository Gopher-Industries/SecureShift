import http from '../lib/http';
import { UserProfile } from '../models/UserProfile';

// Endpoints
const Endpoints = {
  usersMe: '/users/me',
};

// APIs

// Get user profile
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data } = await http.get(Endpoints.usersMe); // Protected GET request with token
    return data as UserProfile;
  } catch (e) {
    console.error('Error getting user profile:', e);
    return null;
  }
};

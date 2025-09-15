import http from '../lib/http';
import { UserProfile } from '../models/UserProfile';

// Endpoints
const Endpoints = {
  usersMe: '/users/me',
};

// Update profile payload type
export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
  };
};

// APIs

// Get user profile
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data } = await http.get(Endpoints.usersMe);
    return data as UserProfile;
  } catch (e) {
    console.error('Error getting user profile:', e);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (
  payload: UpdateProfilePayload,
): Promise<UserProfile | null> => {
  try {
    const { data } = await http.put(Endpoints.usersMe, payload);
    return data as UserProfile;
  } catch (e) {
    console.error('Error updating user profile:', e);
    return null;
  }
};

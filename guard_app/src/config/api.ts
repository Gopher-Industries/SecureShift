import { Platform } from 'react-native';
import { http } from '../services/httpClient';
import { UserProfile } from '../models/UserProfile';

// This file is used to configure the APIs

export const API_BASE_URL: string =
  (process.env.API_BASE_URL as string) ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000'); // Local for android and ios simulator

// Endpoints
export const Endpoints = {
  usersMe: '/api/v1/users/me',
} as const;

// APIs
export const Api = {
  getUserProfile: async function(): Promise<UserProfile> {
    return http.get<UserProfile>(Endpoints.usersMe);
  }
}

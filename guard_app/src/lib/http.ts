import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { LocalStorage } from './localStorage';

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  if (__DEV__) {
    if (Platform.OS === 'web') {
      return 'http://localhost:5000';
    }

    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:5000`;
    }

    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000';
    }
  }

  return 'http://localhost:5000';
};

export const API_BASE_URL: string = getApiBaseUrl();

export const API_PATH: string = '/api/v1';

// Create an Axios instance with a base URL and timeout
const http = axios.create({
  baseURL: API_BASE_URL + API_PATH, // API base URL from environment variable
  timeout: 20000, // 20 second timeout for requests
});

// Automatically attach JWT token from AsyncStorage to every request
http.interceptors.request.use(async (config) => {
  const token = await LocalStorage.getToken(); // Retrieve token from storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Attach token to Authorization header
  }
  return config;
});

// Attach handler to catch 401 Unauthorized errors and auto logout
export function attach401Handler(onUnauthorized: () => void) {
  http.interceptors.response.use(
    (res) => res, // Pass successful responses through
    async (err) => {
      if (err?.response?.status === 401) {
        await LocalStorage.clearAll(); // Clear tokens on 401
        onUnauthorized(); // Trigger logout handler (e.g., navigate to Login)
      }
      throw err; // Rethrow error for further handling
    },
  );
}

export default http; // Export configured Axios instance

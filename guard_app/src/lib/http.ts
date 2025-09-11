import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Create an Axios instance with a base URL and timeout
const http = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL, // API base URL from environment variable
  timeout: 20000, // 20 second timeout for requests
});

// Automatically attach JWT token from AsyncStorage to every request
http.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token'); // Retrieve token from storage
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
        await AsyncStorage.multiRemove(['auth_token', 'auth_user']); // Clear tokens on 401
        onUnauthorized(); // Trigger logout handler (e.g., navigate to Login)
      }
      throw err; // Rethrow error for further handling
    },
  );
}

export default http; // Export configured Axios instance

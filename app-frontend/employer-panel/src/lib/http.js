import axios from 'axios';

// Create an Axios instance with a base URL and timeout
const http = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 20000, // 20 second timeout for requests
});

// Automatically attach JWT token from localStorage to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Retrieve token from storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Attach token to Authorization header
  }
  return config;
});

// Attach handler to catch 401 Unauthorized errors and auto logout
export function attach401Handler(onUnauthorized) {
  http.interceptors.response.use(
    (res) => res, // Pass successful responses through
    (err) => {
      if (err?.response?.status === 401) {
        localStorage.removeItem('token'); // Clear token on 401
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        onUnauthorized(); // Trigger logout handler (e.g., navigate to Login)
      }
      throw err; // Rethrow error for further handling
    }
  );
}

export default http; // Export configured Axios instance




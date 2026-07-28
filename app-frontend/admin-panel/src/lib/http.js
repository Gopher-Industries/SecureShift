import axios from 'axios';

// Shared Axios instance. Base URL is configurable via env (no hardcoded prod URLs).
const http = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 20000,
});

// Attach JWT to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 — but only for an EXPIRED SESSION (a token already exists).
// A 401 from the login attempt itself (no token yet) must NOT redirect, so the
// login form can show the real error (e.g. "Invalid credentials").
export function attach401Handler(onUnauthorized) {
  http.interceptors.response.use(
    (res) => res,
    (err) => {
      const hadSession = !!localStorage.getItem('token');
      if (err?.response?.status === 401 && hadSession) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        if (onUnauthorized) onUnauthorized();
      }
      throw err;
    }
  );
}

export default http;

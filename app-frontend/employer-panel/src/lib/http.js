import axios from 'axios';

// =========================
// Retry configuration
// =========================
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (err) => {
  const status = err?.response?.status;

  // No response → network / server unreachable
  if (!err?.response) return true;

  // Transient server errors
  return status === 502 || status === 503 || status === 504;
};

// =========================
// Axios instance
// =========================
const http = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 20000, // 20 seconds
});

// =========================
// Request interceptor
// =========================
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Track retry attempts per request
  config.__retryCount = config.__retryCount || 0;

  return config;
});

// =========================
// Response interceptor
// =========================
export function attach401Handler(onUnauthorized) {
  http.interceptors.response.use(
    (res) => res,
    async (err) => {
      // ---- 401: Auto logout ----
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');

        if (typeof onUnauthorized === 'function') {
          onUnauthorized();
        }

        throw err;
      }

      // ---- Retry logic ----
      const config = err?.config;
      if (config && shouldRetry(err) && config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;

        await sleep(RETRY_DELAY_MS * config.__retryCount);
        return http(config); // retry request
      }

      // ---- User-friendly error message ----
      err.userMessage =
        !err.response
          ? 'No internet connection. Please check your network and try again.'
          : [502, 503, 504].includes(err.response.status)
          ? 'Server is temporarily unavailable. Please try again shortly.'
          : err.response.status === 400 || err.response.status === 422
          ? 'Some information is invalid. Please check your input and try again.'
          : err.response.status === 403
          ? 'You do not have permission to perform this action.'
          : err.response.status === 404
          ? 'Requested resource was not found.'
          : 'Something went wrong. Please try again.';

      throw err;
    }
  );
}

export default http;

import axios from 'axios';
import viewAsAudit from '../utils/viewAsAudit';

// Shared Axios instance. Base URL is configurable via env (no hardcoded prod URLs).
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
const REQUEST_TIMEOUT = 20000;

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
});

// Attach JWT to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// AP-046 — "View As" write-blocking, at the axios level rather than only
// disabling buttons in the UI. Module-level state, updated by ViewAsContext
// via setViewAsState() — same wiring pattern as attach401Handler below.
let viewAsState = { active: false, user: null };
const WRITE_METHODS = ['post', 'put', 'patch', 'delete'];

export function setViewAsState(state) {
  viewAsState = state;
}

function decodeAdminId() {
  try {
    const token = localStorage.getItem('token');
    return token ? JSON.parse(atob(token.split('.')[1])).id : null;
  } catch {
    return null;
  }
}

export function attachViewAsWriteBlocker(showToast) {
  http.interceptors.request.use((config) => {
    const method = (config.method || 'get').toLowerCase();

    if (viewAsState.active && WRITE_METHODS.includes(method)) {
      viewAsAudit.blockedWrite({
        adminId: decodeAdminId(),
        targetUserId: viewAsState.user?.id,
        targetRole: viewAsState.user?.role,
        method: method.toUpperCase(),
        url: config.url,
      });

      if (showToast) {
        showToast('Action disabled — read-only View As mode.', 'error');
      }

      const blocked = new Error('Blocked: read-only View As mode');
      blocked.isViewAsBlocked = true;
      return Promise.reject(blocked);
    }

    return config;
  });
}

// Auto-logout on 401 — but only for an EXPIRED SESSION (a token already exists).
// A 401 from the login attempt itself (no token yet) must NOT redirect, so the
// login form can show the real error (e.g. "Invalid credentials").
export function attach401Handler(onUnauthorized) {
  http.interceptors.response.use(
    (response) => response,
    (error) => {
      const hadActiveSession = !!localStorage.getItem('token');
      const isUnauthorized = error?.response?.status === 401;

      if (isUnauthorized && hadActiveSession) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');

        if (onUnauthorized) {
          onUnauthorized();
        }
      }

      throw error;
    }
  );
}

// Show a toast for unexpected errors (network failures, 5xx server errors).
// 401s are handled separately by attach401Handler (redirects to login).
// 4xx errors are left to page-level code, since those usually need a
// specific message (e.g. validation errors on a form).
export function attachErrorToastHandler(showToast) {
  http.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.isViewAsBlocked) {
        throw err; // View As already surfaced its own toast — skip the generic network-error one
      }

      const status = err?.response?.status;
      if (!status || status >= 500) {
        const message = !err?.response
          ? 'Network error — please check your connection.'
          : 'Something went wrong on the server. Please try again.';
        showToast(message, 'error');
      }
      throw err;
    }
  );
}

export default http;

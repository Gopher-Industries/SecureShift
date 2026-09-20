import { jwtDecode } from 'jwt-decode';

export const getToken = () => localStorage.getItem('token');
export const getRole = () => localStorage.getItem('role');
export const setSession = (token, role) => {
  localStorage.setItem('token', token);
  if (role) localStorage.setItem('role', role);
};
export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// True only if a token exists but is expired or invalid.
export const hasExpiredToken = () => {
  const token = getToken();
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

// Admin route protection: only admin / super_admin may enter.
export const isAdmin = () => {
  const token = getToken();
  if (!token) return false;
  try {
    const role = jwtDecode(token).role || getRole();
    return role === 'admin' || role === 'super_admin';
  } catch {
    return false;
  }
};

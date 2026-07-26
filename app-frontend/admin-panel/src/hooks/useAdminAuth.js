import { useCallback } from 'react';
import { adminLogin } from '../service/adminAPI';
import { setSession, clearSession, isAuthenticated, isAdmin, getRole } from '../utils/authentication';

export default function useAdminAuth() {
  const login = useCallback(async (email, password) => {
    const data = await adminLogin(email, password);
    if (!data?.token) throw new Error('No token returned');
    setSession(data.token, data.role);
    return data;
  }, []);

  const logout = useCallback(() => clearSession(), []);

  return { login, logout, isAuthenticated: isAuthenticated(), isAdmin: isAdmin(), role: getRole() };
}

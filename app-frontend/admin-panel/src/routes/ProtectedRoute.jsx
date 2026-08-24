import { Navigate } from 'react-router-dom';
import { getToken, isAuthenticated, isAdmin, hasExpiredToken, clearSession } from '../utils/authentication';

export default function ProtectedRoute({ children }) {
  const token = getToken();

  // No session exists — send user to the normal Admin login.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // A session exists but the token is invalid or expired.
  if (!isAuthenticated()) {
    // Expired token: clear it and show a message on login.
    if (hasExpiredToken()) {
      clearSession();
      return <Navigate to="/login?sessionExpired=1" replace />;
    }
    return <Navigate to="/access-denied" replace />;
  }

  // Valid session, but not an admin.
  if (!isAdmin()) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

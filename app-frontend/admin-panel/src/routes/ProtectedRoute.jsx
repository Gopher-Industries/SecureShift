import { Navigate } from 'react-router-dom';
import { getToken, isAuthenticated, isAdmin } from '../utils/authentication';

export default function ProtectedRoute({ children }) {
  const token = getToken();

  // No session exists — send user to the normal Admin login.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // A session exists but the token is invalid or expired.
  if (!isAuthenticated()) {
    return <Navigate to="/access-denied" replace />;
  }

  // The session is valid, but the user does not have Admin privileges.
  if (!isAdmin()) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

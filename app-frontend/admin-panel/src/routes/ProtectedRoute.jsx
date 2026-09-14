import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin } from '../utils/authentication';

// Admin-only guard: unauthenticated or non-admin users are redirected to login.
export default function ProtectedRoute({ children }) {
  if (!isAuthenticated() || !isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

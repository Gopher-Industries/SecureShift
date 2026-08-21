import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import Users from '../pages/Users';
import UserDetails from '../pages/UserDetails';
import GuardVerification from '../pages/GuardVerification';
import Shifts from '../pages/Shifts';
import AuditLogs from '../pages/AuditLogs';
import Messages from '../pages/Messages';
import SMTPSettings from '../pages/SMTPSettings';
import NotFound from '../pages/NotFound';
import AccessDenied from '../pages/AccessDenied';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<AdminDashboard />} />

        <Route path="/users" element={<Users />} />

        <Route path="/users/:id" element={<UserDetails />} />

        <Route path="/guard-verification" element={<GuardVerification />} />

        <Route path="/shifts" element={<Shifts />} />

        <Route path="/audit-logs" element={<AuditLogs />} />

        <Route path="/messages" element={<Messages />} />

        <Route path="/smtp-settings" element={<SMTPSettings />} />
      </Route>

      <Route path="/access-denied" element={<AccessDenied />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

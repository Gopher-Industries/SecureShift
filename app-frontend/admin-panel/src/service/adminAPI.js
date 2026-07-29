import http from '../lib/http';

// ---- Admin API inventory (all under /api/v1/admin) ----
// Auth
export const adminLogin = (email, password) =>
  http.post('/admin/login', { email, password }).then((r) => r.data);

// User management
export const getUsers = (params) => http.get('/admin/users', { params }).then((r) => r.data);
export const getUser = (id) => http.get(`/admin/users/${id}`).then((r) => r.data);
export const deleteUser = (id) => http.delete(`/admin/users/${id}`).then((r) => r.data);

// Guard verification
export const getPendingGuards = (params) =>
  http.get('/admin/guards/pending', { params }).then((r) => r.data);
export const verifyGuardLicense = (id, body) =>
  http.patch(`/admin/guards/${id}/license/verify`, body).then((r) => r.data);
export const rejectGuardLicense = (id, body) =>
  http.patch(`/admin/guards/${id}/license/reject`, body).then((r) => r.data);

// Oversight
export const getShifts = (params) => http.get('/admin/shifts', { params }).then((r) => r.data);
export const getAuditLogs = (params) =>
  http.get('/admin/audit-logs', { params }).then((r) => r.data);
export const getMessages = (params) => http.get('/admin/messages', { params }).then((r) => r.data);

// System configuration
export const getSmtpSettings = () => http.get('/admin/smtp-settings').then((r) => r.data);
export const updateSmtpSettings = (body) =>
  http.put('/admin/smtp-settings', body).then((r) => r.data);
export const testSmtpSettings = (body) =>
  http.post('/admin/smtp-settings/test', body).then((r) => r.data);

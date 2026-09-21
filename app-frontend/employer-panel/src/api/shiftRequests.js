// GA-020 — shift swap / leave approval (employer side).
// Thin wrapper over the shared axios instance for the backend ShiftRequest API
// (backend already merged: GET /shift-requests, PATCH /shift-requests/:id).
import http from '../lib/http';

// List shift requests. Employers see requests within their scope.
// params: { status?: 'PENDING'|'APPROVED'|'REJECTED', type?: 'SWAP'|'LEAVE', page?, limit? }
// Returns { page, limit, total, pages, items }.
export const getShiftRequests = (params = {}) =>
  http.get('/shift-requests', { params }).then((r) => r.data);

// Approve or reject a pending request.
// A rejection should include a reason; approval ignores it.
export const decideShiftRequest = (id, { status, rejectionReason } = {}) =>
  http.patch(`/shift-requests/${id}`, { status, rejectionReason }).then((r) => r.data);

export const approveShiftRequest = (id) => decideShiftRequest(id, { status: 'APPROVED' });

export const rejectShiftRequest = (id, rejectionReason) =>
  decideShiftRequest(id, { status: 'REJECTED', rejectionReason });

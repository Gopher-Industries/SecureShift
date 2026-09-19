import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { getShiftRequests, approveShiftRequest, rejectShiftRequest } from '../api/shiftRequests';
import './ShiftRequests.css';

const STATUS_FILTERS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];
const TYPE_FILTERS = ['ALL', 'SWAP', 'LEAVE'];

function formatDate(value) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function guardName(guard) {
  if (!guard) return 'Unknown guard';
  return guard.name || guard.email || 'Unknown guard';
}

function shiftLabel(shift) {
  if (!shift) return '--';
  const when = [formatDate(shift.date), [shift.startTime, shift.endTime].filter(Boolean).join('–')]
    .filter(Boolean)
    .join(' ');
  return [shift.title, when].filter(Boolean).join(' · ');
}

// Small confirm-with-reason dialog for rejections.
function RejectDialog({ request, onCancel, onConfirm, submitting }) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  return (
    <div className="sr-modal-backdrop" role="dialog" aria-modal="true" aria-label="Reject request">
      <div className="sr-modal">
        <h3 className="sr-modal__title">Reject request</h3>
        <p className="sr-modal__sub">
          {request.type === 'LEAVE' ? 'Leave' : 'Swap'} request from{' '}
          {guardName(request.requestingGuardId)}
        </p>
        <label className="sr-modal__label" htmlFor="sr-reject-reason">
          Reason for rejection
        </label>
        <textarea
          id="sr-reject-reason"
          className="sr-modal__textarea"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Let the guard know why this was declined…"
          rows={4}
        />
        <div className="sr-modal__actions">
          <button
            type="button"
            className="sr-btn sr-btn--ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="sr-btn sr-btn--danger"
            onClick={() => onConfirm(trimmed)}
            disabled={submitting || trimmed.length === 0}
          >
            {submitting ? 'Rejecting…' : 'Confirm reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShiftRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [actingId, setActingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      const data = await getShiftRequests(params);
      setItems(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load shift requests.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (request) => {
    setActingId(request._id);
    try {
      await approveShiftRequest(request._id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to approve request.');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    setActingId(rejectTarget._id);
    try {
      await rejectShiftRequest(rejectTarget._id, reason);
      setRejectTarget(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to reject request.');
    } finally {
      setActingId(null);
    }
  };

  const pendingCount = useMemo(() => items.filter((r) => r.status === 'PENDING').length, [items]);

  return (
    <div className="sr-page">
      <header className="sr-header">
        <div>
          <h1 className="sr-title">Shift Swap &amp; Leave Requests</h1>
          <p className="sr-subtitle">
            Review and action guard requests to swap shifts or take leave.
            {statusFilter === 'PENDING' && !loading ? ` ${pendingCount} pending.` : ''}
          </p>
        </div>
        <button type="button" className="sr-btn sr-btn--ghost" onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <div className="sr-filters" role="group" aria-label="Filters">
        <div className="sr-filter-group" role="group" aria-label="Status">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`sr-chip ${statusFilter === s ? 'sr-chip--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="sr-filter-group" role="group" aria-label="Type">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              type="button"
              className={`sr-chip ${typeFilter === t ? 'sr-chip--active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'ALL' ? 'All types' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="sr-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="sr-muted">Loading requests…</p>
      ) : items.length === 0 ? (
        <p className="sr-muted">
          No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} requests found.
        </p>
      ) : (
        <ul className="sr-list">
          {items.map((req) => {
            const isPending = req.status === 'PENDING';
            const acting = actingId === req._id;
            return (
              <li key={req._id} className="sr-card">
                <div className="sr-card__top">
                  <span className={`sr-badge sr-badge--${req.type === 'LEAVE' ? 'leave' : 'swap'}`}>
                    {req.type === 'LEAVE' ? 'Leave' : 'Swap'}
                  </span>
                  <span className={`sr-status sr-status--${(req.status || '').toLowerCase()}`}>
                    {req.status}
                  </span>
                  <span className="sr-card__date">{formatDateTime(req.createdAt)}</span>
                </div>

                <div className="sr-card__body">
                  <p className="sr-row">
                    <span className="sr-label">Requested by</span>
                    <span>{guardName(req.requestingGuardId)}</span>
                  </p>
                  <p className="sr-row">
                    <span className="sr-label">Shift</span>
                    <span>{shiftLabel(req.originalShiftId)}</span>
                  </p>
                  {req.type === 'SWAP' ? (
                    <>
                      <p className="sr-row">
                        <span className="sr-label">Swap with</span>
                        <span>{guardName(req.targetGuardId)}</span>
                      </p>
                      {req.replacementShiftId && (
                        <p className="sr-row">
                          <span className="sr-label">For shift</span>
                          <span>{shiftLabel(req.replacementShiftId)}</span>
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="sr-row">
                      <span className="sr-label">Leave dates</span>
                      <span>
                        {formatDate(req.leaveStartDate)} – {formatDate(req.leaveEndDate)}
                      </span>
                    </p>
                  )}
                  <p className="sr-row">
                    <span className="sr-label">Reason</span>
                    <span>{req.reason || '--'}</span>
                  </p>
                  {req.status === 'REJECTED' && req.rejectionReason && (
                    <p className="sr-row">
                      <span className="sr-label">Rejection reason</span>
                      <span>{req.rejectionReason}</span>
                    </p>
                  )}
                </div>

                {isPending && (
                  <div className="sr-card__actions">
                    <button
                      type="button"
                      className="sr-btn sr-btn--danger"
                      onClick={() => setRejectTarget(req)}
                      disabled={acting}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="sr-btn sr-btn--primary"
                      onClick={() => handleApprove(req)}
                      disabled={acting}
                    >
                      {acting ? 'Approving…' : 'Approve'}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {rejectTarget && (
        <RejectDialog
          request={rejectTarget}
          submitting={actingId === rejectTarget._id}
          onCancel={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}

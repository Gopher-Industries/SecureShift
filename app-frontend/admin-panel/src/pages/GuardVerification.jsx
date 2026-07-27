import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPendingGuards, verifyGuardLicense, rejectGuardLicense } from '../service/adminAPI';
import LoadingComponent from '../components/LoadingComponent';
import Modal from '../components/Modal';
import colors from '../theme/colors';

// Employer/Admin-panel shared visual language (matches employer-panel Payroll/Dashboard).
const ui = {
  page: { color: colors.text },
  subtitle: { color: colors.muted, marginTop: -6, marginBottom: 18 },
  toolbar: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 },
  input: {
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: '9px 14px',
    fontSize: 14,
    width: 280,
    outline: 'none',
  },
  select: {
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: '9px 14px',
    fontSize: 14,
    background: colors.white,
    color: colors.text,
    cursor: 'pointer',
  },
  card: {
    background: colors.card,
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(16,24,40,0.08)',
    overflow: 'hidden',
    border: `1px solid ${colors.border}`,
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: '#4a5568',
    fontWeight: 600,
    background: '#f7fafc',
    borderBottom: `1px solid ${colors.border}`,
  },
  td: { padding: '13px 16px', color: '#2d3748', borderBottom: `1px solid #eef0f3`, fontSize: 14 },
  btn: {
    border: 'none',
    borderRadius: 8,
    padding: '7px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnPrimary: { background: colors.primary, color: colors.white },
  btnGhost: {
    background: colors.white,
    color: colors.primary,
    border: `1px solid ${colors.primary}`,
  },
  btnDanger: {
    background: colors.white,
    color: colors.danger,
    border: `1px solid ${colors.danger}`,
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
};

const STATUS_STYLES = {
  pending: { bg: '#fef3c7', fg: '#854f0b' },
  verified: { bg: '#dcfce7', fg: '#166534' },
  rejected: { bg: '#fee2e2', fg: '#991b1b' },
  expired: { bg: '#e5e7eb', fg: '#374151' },
  none: { bg: '#e5e7eb', fg: '#374151' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.none;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'capitalize',
        background: s.bg,
        color: s.fg,
      }}
    >
      {status || 'none'}
    </span>
  );
}

// The pending endpoint returns each guard's license under `documents` (type === 'license').
function licenseOf(guard) {
  const docs = Array.isArray(guard.documents) ? guard.documents : [];
  return docs.find((d) => d.type === 'license') || null;
}

export default function GuardVerification() {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actingId, setActingId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }
  const [viewTarget, setViewTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = statusFilter ? { status: statusFilter } : undefined;
      const data = await getPendingGuards(params);
      const list = Array.isArray(data) ? data : data.guards || data.data || [];
      // Only guards that actually have a license document to review.
      setGuards(list.filter((g) => licenseOf(g)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load pending guards');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      guards.filter(
        (g) => !query || `${g.name} ${g.email}`.toLowerCase().includes(query.toLowerCase())
      ),
    [guards, query]
  );

  async function handleVerify(guard) {
    if (actingId) return; // prevent double-submit
    setActingId(guard.id);
    setFeedback(null);
    try {
      await verifyGuardLicense(guard.id, {});
      setFeedback({ type: 'success', text: `Verified ${guard.name}'s license.` });
      await load();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to verify license',
      });
    } finally {
      setActingId(null);
    }
  }

  async function submitReject() {
    if (!rejectTarget || actingId) return;
    const guard = rejectTarget;
    setActingId(guard.id);
    setFeedback(null);
    try {
      await rejectGuardLicense(guard.id, { reason: rejectReason.trim() });
      setFeedback({ type: 'success', text: `Rejected ${guard.name}'s license.` });
      setRejectTarget(null);
      setRejectReason('');
      await load();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to reject license',
      });
    } finally {
      setActingId(null);
    }
  }

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  return (
    <div style={ui.page}>
      <h1 style={{ marginBottom: 4 }}>Guard Verification</h1>
      <p style={ui.subtitle}>Review and approve or reject guard licence documents.</p>

      <div style={ui.toolbar}>
        <input
          style={ui.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
        />
        <select
          style={ui.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
          <option value="expiring">Expiring soon</option>
        </select>
      </div>

      {feedback && (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 14,
            background: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
          }}
        >
          {feedback.text}
        </div>
      )}

      {loading ? (
        <LoadingComponent label="Loading pending guards…" />
      ) : error ? (
        <p style={{ color: colors.danger }}>{error}</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: colors.muted }}>No guards awaiting verification.</p>
      ) : (
        <div style={ui.card}>
          <table style={ui.table}>
            <thead>
              <tr>
                <th style={ui.th}>Guard</th>
                <th style={ui.th}>License status</th>
                <th style={ui.th}>Expiry</th>
                <th style={ui.th}>Submitted</th>
                <th style={{ ...ui.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => {
                const lic = licenseOf(g) || {};
                const busy = actingId === g.id;
                const isVerified = lic.status === 'verified';
                const isRejected = lic.status === 'rejected';
                return (
                  <tr key={g.id}>
                    <td style={ui.td}>
                      <div style={{ fontWeight: 600, color: colors.text }}>{g.name}</div>
                      <div style={{ color: colors.muted, fontSize: 13 }}>{g.email}</div>
                    </td>
                    <td style={ui.td}>
                      <StatusBadge status={lic.expired ? 'expired' : lic.status} />
                      {lic.expiringSoon && !lic.expired && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: colors.warning }}>
                          expiring soon
                        </span>
                      )}
                    </td>
                    <td style={ui.td}>{fmtDate(lic.expiryDate)}</td>
                    <td style={ui.td}>{fmtDate(g.createdAt)}</td>
                    <td style={{ ...ui.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        style={{ ...ui.btn, ...ui.btnGhost, marginRight: 8 }}
                        onClick={() => setViewTarget(g)}
                      >
                        View
                      </button>
                      <button
                        style={{
                          ...ui.btn,
                          ...ui.btnPrimary,
                          marginRight: 8,
                          ...(busy || isVerified ? ui.btnDisabled : {}),
                        }}
                        disabled={busy || isVerified}
                        onClick={() => handleVerify(g)}
                      >
                        {busy ? '…' : 'Verify'}
                      </button>
                      <button
                        style={{
                          ...ui.btn,
                          ...ui.btnDanger,
                          ...(busy || isRejected ? ui.btnDisabled : {}),
                        }}
                        disabled={busy || isRejected}
                        onClick={() => {
                          setRejectReason('');
                          setRejectTarget(g);
                        }}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View document modal */}
      <Modal open={!!viewTarget} title="License document" onClose={() => setViewTarget(null)}>
        {viewTarget &&
          (() => {
            const lic = licenseOf(viewTarget) || {};
            return (
              <div style={{ fontSize: 14, minWidth: 320 }}>
                <p style={{ margin: '4px 0' }}>
                  <strong>{viewTarget.name}</strong> — {viewTarget.email}
                </p>
                <p style={{ margin: '4px 0' }}>
                  Status: <StatusBadge status={lic.expired ? 'expired' : lic.status} />
                </p>
                <p style={{ margin: '4px 0' }}>Expiry: {fmtDate(lic.expiryDate)}</p>
                {lic.imageUrl ? (
                  <p style={{ margin: '10px 0 0' }}>
                    <a
                      href={lic.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: colors.primary }}
                    >
                      Open document image
                    </a>
                  </p>
                ) : (
                  <p style={{ margin: '10px 0 0', color: colors.muted }}>
                    The API does not return a document image URL for this record.
                  </p>
                )}
                <div style={{ textAlign: 'right', marginTop: 18 }}>
                  <button style={{ ...ui.btn, ...ui.btnGhost }} onClick={() => setViewTarget(null)}>
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* Reject with reason modal */}
      <Modal open={!!rejectTarget} title="Reject license" onClose={() => setRejectTarget(null)}>
        {rejectTarget && (
          <div style={{ fontSize: 14, minWidth: 340 }}>
            <p style={{ marginTop: 0 }}>
              Reject <strong>{rejectTarget.name}</strong>&rsquo;s license. Please give a reason so
              the guard knows what to fix.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection…"
              rows={4}
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: 10,
                fontSize: 14,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button
                style={{ ...ui.btn, ...ui.btnGhost, marginRight: 8 }}
                onClick={() => setRejectTarget(null)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...ui.btn,
                  background: colors.danger,
                  color: colors.white,
                  ...(!rejectReason.trim() || actingId ? ui.btnDisabled : {}),
                }}
                disabled={!rejectReason.trim() || !!actingId}
                onClick={submitReject}
              >
                {actingId ? 'Rejecting…' : 'Confirm reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

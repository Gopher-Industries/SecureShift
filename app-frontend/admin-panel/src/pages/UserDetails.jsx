import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getUser, deleteUser, getAuditLogs, getShifts } from '../service/adminAPI';
import LoadingComponent from '../components/LoadingComponent';
import ConfirmDialog from '../components/ConfirmDialog';
import Card from '../components/Card';
import Pagination from '../components/Pagination';
import { useTheme } from '../theme/ThemeProvider';

function formatAddress(address) {
  if (!address) return '—';
  if (typeof address === 'string') return address;
  const parts = [address.street, address.suburb, address.state, address.postcode].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

const AUDIT_PAGE_SIZE = 10;

export default function UserDetails() {
  const { colors } = useTheme();
  const row = {
    display: 'flex',
    gap: 8,
    padding: '10px 0',
    borderBottom: `1px solid ${colors.border}`,
  };
  const label = { width: 140, color: colors.muted, fontWeight: 600 };

  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');

  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [shiftsError, setShiftsError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        setNotFound(false);
        const data = await getUser(id);
        if (mounted) setUser(data.user || data);
      } catch (err) {
        if (!mounted) return;
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(err?.response?.data?.message || 'Failed to load user');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError('');
      await deleteUser(id);
      navigate('/users');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete user');
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const closeConfirm = () => {
    if (deleting) return;
    setConfirmOpen(false);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setAuditLoading(true);
        setAuditError('');
        const data = await getAuditLogs({ userId: id, page: auditPage, limit: AUDIT_PAGE_SIZE });
        if (!mounted) return;
        setAuditLogs(data.logs || []);
        setAuditTotal(data.pagination?.total ?? data.logs?.length ?? 0);
      } catch (err) {
        if (mounted) setAuditError(err?.response?.data?.message || 'Failed to load activity');
      } finally {
        if (mounted) setAuditLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, auditPage]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setShiftsLoading(true);
        setShiftsError('');
        const data = await getShifts();
        const list = Array.isArray(data) ? data : data.shifts || data.data || [];
        const mine = list.filter((s) => s.createdBy?._id === id || s.acceptedBy?._id === id);
        if (mounted) setShifts(mine);
      } catch (err) {
        if (mounted) setShiftsError(err?.response?.data?.message || 'Failed to load shifts');
      } finally {
        if (mounted) setShiftsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const auditTotalPages = Math.max(1, Math.ceil(auditTotal / AUDIT_PAGE_SIZE));

  return (
    <div>
      <h1>User Details</h1>
      <p style={{ marginTop: -8 }}>
        <Link to="/users" style={{ color: colors.primary }}>
          &larr; Back to Users
        </Link>
      </p>

      {loading ? (
        <LoadingComponent />
      ) : notFound ? (
        <p style={{ color: colors.danger }}>User not found.</p>
      ) : (
        <>
          {error ? <p style={{ color: colors.error }}>{error}</p> : null}
          {user ? (
            <>
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: 16,
                maxWidth: 480,
              }}
            >
              <div style={row}>
                <span style={label}>Name</span>
                <span>{user.name}</span>
              </div>
              <div style={row}>
                <span style={label}>Email</span>
                <span>{user.email}</span>
              </div>
              <div style={row}>
                <span style={label}>Role</span>
                <span>{user.role}</span>
              </div>
              <div style={row}>
                <span style={label}>Phone</span>
                <span>{user.phone || '—'}</span>
              </div>
              <div style={row}>
                <span style={label}>Address</span>
                <span>{formatAddress(user.address)}</span>
              </div>
              <div style={row}>
                <span style={label}>Joined</span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
              <div style={{ ...row, borderBottom: 'none' }}>
                <span style={label}>Last Updated</span>
                <span>{formatDate(user.updatedAt)}</span>
              </div>

              <button
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                style={{
                  marginTop: 16,
                  background: colors.danger,
                  color: colors.white,
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: deleting ? 'default' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Delete User'}
              </button>
            </div>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <Card style={{ flex: '1 1 380px', minWidth: 320 }}>
                  <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
                  {auditLoading ? (
                    <p style={{ color: colors.muted, fontSize: 14 }}>Loading activity…</p>
                  ) : auditError ? (
                    <p style={{ color: colors.danger, fontSize: 14 }}>{auditError}</p>
                  ) : auditLogs.length === 0 ? (
                    <p style={{ color: colors.muted, fontSize: 14 }}>
                      No audit activity recorded for this user yet.
                    </p>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {auditLogs.map((log) => (
                          <div
                            key={log._id}
                            style={{
                              borderBottom: `1px solid ${colors.border}`,
                              paddingBottom: 8,
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{log.action}</div>
                            <div style={{ fontSize: 12, color: colors.muted }}>
                              {formatDate(log.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <Pagination
                        page={auditPage}
                        totalPages={auditTotalPages}
                        totalItems={auditTotal}
                        pageSize={AUDIT_PAGE_SIZE}
                        onPageChange={setAuditPage}
                      />
                      <Link
                        to={`/audit-logs?userId=${id}`}
                        style={{
                          fontSize: 13,
                          color: colors.primary,
                          display: 'inline-block',
                          marginTop: 8,
                        }}
                      >
                        View full audit log for this user &rarr;
                      </Link>
                    </>
                  )}
                </Card>

                <Card style={{ flex: '1 1 380px', minWidth: 320 }}>
                  <h3 style={{ marginTop: 0 }}>Shifts</h3>
                  {shiftsLoading ? (
                    <p style={{ color: colors.muted, fontSize: 14 }}>Loading shifts…</p>
                  ) : shiftsError ? (
                    <p style={{ color: colors.danger, fontSize: 14 }}>{shiftsError}</p>
                  ) : shifts.length === 0 ? (
                    <p style={{ color: colors.muted, fontSize: 14 }}>
                      No shifts associated with this user.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {shifts.slice(0, 10).map((s) => (
                        <Link
                          key={s._id}
                          to={`/shifts?q=${encodeURIComponent(s.title || s._id)}`}
                          style={{
                            borderBottom: `1px solid ${colors.border}`,
                            paddingBottom: 8,
                            color: colors.text,
                            textDecoration: 'none',
                            display: 'block',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {s.title || 'Untitled shift'}
                          </div>
                          <div style={{ fontSize: 12, color: colors.muted }}>
                            {s.status} · {formatDate(s.date)}
                          </div>
                        </Link>
                      ))}
                      {shifts.length > 10 && (
                        <span style={{ fontSize: 12, color: colors.muted }}>
                          Showing 10 of {shifts.length} shifts.
                        </span>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this user?"
        message="This action cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        danger
        onConfirm={handleDelete}
        onCancel={closeConfirm}
        confirmDisabled={deleting}
        cancelDisabled={deleting}
      />
    </div>
  );
}

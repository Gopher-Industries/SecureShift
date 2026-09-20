import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getUser, deleteUser } from '../service/adminAPI';
import LoadingComponent from '../components/LoadingComponent';
import colors from '../theme/colors';

function formatAddress(address) {
  if (!address) return '—';
  if (typeof address === 'string') return address;
  const parts = [address.street, address.suburb, address.state, address.postcode].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

const row = {
  display: 'flex',
  gap: 8,
  padding: '10px 0',
  borderBottom: `1px solid ${colors.border}`,
};
const label = { width: 140, color: colors.muted, fontWeight: 600 };

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

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
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      setDeleting(true);
      setError('');
      await deleteUser(id);
      navigate('/users');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete user');
      setDeleting(false);
    }
  };

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
          {error ? <p style={{ color: colors.danger }}>{error}</p> : null}
          {user ? (
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
                onClick={handleDelete}
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
          ) : null}
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';

const inp = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  margin: '6px 0 14px',
  border: '1px solid #ccc',
  borderRadius: 4,
  boxSizing: 'border-box',
};
const btn = {
  width: '100%',
  padding: 10,
  background: '#274b93',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Show the expired-session message once, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('sessionExpired') === '1') {
      setSessionExpired(true);
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSessionExpired(false);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          background: '#fff',
          padding: 32,
          borderRadius: 8,
          width: 340,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#274b93' }}>SecureShift Admin</h2>
        {sessionExpired && (
          <p
            role="status"
            style={{
              color: '#8a6100',
              background: '#fff6e0',
              padding: '8px 10px',
              borderRadius: 4,
            }}
          >
            Your session has expired. Please log in again.
          </p>
        )}
        {error && <p style={{ color: '#c00' }}>{error}</p>}
        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          style={inp}
        />
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          style={inp}
        />
        <button disabled={loading} style={{ ...btn, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in\u2026' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';

export default function AdminNavbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { logout, role } = useAdminAuth();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        background: '#072261',
        color: '#fff',
      }}
    >
      <button
        onClick={onMenuClick}
        className="admin-hamburger"
        aria-label="Toggle menu"
        style={{
          background: 'none',
          border: 'none',
          fontSize: 24,
          cursor: 'pointer',
          padding: 4,
          color: '#fff',
        }}
      >
        ☰
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <img
          src="/logo192.png"
          alt="SecureShift Logo"
          style={{
            width: '52px',
            height: '52px',
            objectFit: 'contain',
          }}
        />

        <span
          style={{
            fontSize: '22px',
            fontWeight: 600,
          }}
        >
          Secure Shift Admin
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginLeft: 'auto',
        }}
      >
        <span style={{ color: '#fff' }}>Signed in as {role || 'admin'}</span>

        <button
          onClick={onLogout}
          style={{
            padding: '8px 18px',
            background: '#274b93',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

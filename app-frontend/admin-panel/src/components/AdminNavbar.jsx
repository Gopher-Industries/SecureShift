import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';

export default function AdminNavbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { logout, role } = useAdminAuth();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '10px 24px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
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
          color: '#18284f',
        }}
      >
        ☰
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#555' }}>Signed in as {role || 'admin'}</span>
        <button
          onClick={onLogout}
          style={{
            padding: '6px 14px',
            background: '#274b93',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}

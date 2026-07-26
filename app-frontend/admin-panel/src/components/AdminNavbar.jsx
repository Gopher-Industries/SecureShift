import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';

export default function AdminNavbar() {
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
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
        padding: '10px 24px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
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
    </header>
  );
}

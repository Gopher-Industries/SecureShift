import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';
import logo from '../logo.png';

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
        height: '70px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        background: '#072261',
        color: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <img
          src={logo}
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
          Log out
        </button>
      </div>
    </header>
  );
}

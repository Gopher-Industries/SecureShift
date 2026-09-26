import NotificationBell from './NotificationBell';
import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';
import GlobalSearch from './GlobalSearch';
import { useTheme } from '../theme/ThemeProvider';

export default function AdminNavbar({ onMenuClick }) {
  const { colors } = useTheme();

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
        background: colors.card,
        borderBottom: `1px solid ${colors.border}`,
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
          color: colors.primaryDark,
        }}
      >
        ☰
      </button>

      <GlobalSearch />

      <NotificationBell />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
        <span style={{ color: colors.mutedDark }}>Signed in as {role || 'admin'}</span>
        <button
          onClick={onLogout}
          style={{
            padding: '6px 14px',
            background: colors.primary,
            color: colors.white,
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

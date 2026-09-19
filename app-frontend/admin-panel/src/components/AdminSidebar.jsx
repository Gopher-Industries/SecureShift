import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';

const MenuIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512">
    <path
      d="M80 160h352M80 256h352M80 352h352"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit="10"
      strokeWidth="32"
    />
  </svg>
);

const DashboardIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="none"
    stroke={color}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="32"
  >
    <rect width="176" height="176" x="48" y="48" />
    <rect width="176" height="176" x="288" y="48" />
    <rect width="176" height="176" x="48" y="288" />
    <rect width="176" height="176" x="288" y="288" />
  </svg>
);

const UsersIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
    <path
      d="M402 168c-2.93 40.67-33.1 72-66 72s-63.12-31.32-66-72c-3-42.31 26.37-72 66-72s69 30.46 66 72"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <path
      d="M336 304c-65.17 0-127.84 32.37-143.54 95.41-2.08 8.34 3.15 16.59 11.72 16.59h263.65c8.57 0 13.77-8.25 11.72-16.59C463.85 335.36 401.18 304 336 304Z"
      strokeMiterlimit="10"
    />

    <path
      d="M200 185.94c-2.34 32.48-26.72 58.06-53 58.06s-50.7-25.57-53-58.06C91.61 152.15 115.34 128 147 128s55.39 24.77 53 57.94"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <path
      d="M206 306c-18.05-8.27-37.93-11.45-59-11.45-52 0-102.1 25.85-114.65 76.2-1.65 6.66 2.53 13.25 9.37 13.25H154"
      strokeLinecap="round"
      strokeMiterlimit="10"
    />
  </svg>
);

const GuardIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="none"
    stroke={color}
    strokeLinejoin="round"
    strokeWidth="32"
  >
    <rect width="320" height="448" x="96" y="32" rx="48" />

    <path d="M208 80h96" strokeLinecap="round" />

    <path
      d="M333.48 284.51A39.65 39.65 0 0 0 304 272c-11.6 0-22.09 4.41-29.54 12.43s-11.2 19.12-10.34 31C265.83 338.91 283.72 358 304 358s38.14-19.09 39.87-42.55c.88-11.78-2.82-22.77-10.39-30.94M371.69 448H236.31a12.05 12.05 0 0 1-9.31-4.17 13 13 0 0 1-2.76-10.92c3.25-17.56 13.38-32.31 29.3-42.66C267.68 381.06 285.6 376 304 376s36.32 5.06 50.46 14.25c15.92 10.35 26.05 25.1 29.3 42.66a13 13 0 0 1-2.76 10.92 12.05 12.05 0 0 1-9.31 4.17"
      fill={color}
      strokeWidth="1"
    />
  </svg>
);

const ShiftIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M18.35 11.77L11.81 18.31L8.28 14.77"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <rect x="3" y="2" width="18" height="20" rx="4" stroke={color} strokeWidth="2" />

    <path d="M8 6H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IncidentIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const AuditIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="none"
    stroke={color}
    strokeLinejoin="round"
    strokeWidth="32"
  >
    <path d="M416 221.25V416a48 48 0 0 1-48 48H144a48 48 0 0 1-48-48V96a48 48 0 0 1 48-48h98.75a32 32 0 0 1 22.62 9.37l141.26 141.26a32 32 0 0 1 9.37 22.62Z" />

    <path d="M256 56v120a32 32 0 0 0 32 32h120M176 288h160M176 368h160" strokeLinecap="round" />
  </svg>
);

const ChatIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SMTPIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="none"
    stroke={color}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="32"
  >
    <rect width="416" height="320" x="48" y="96" rx="40" />
    <path d="m112 160 144 112 144-112" />
  </svg>
);

const RolesIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const SettingsIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />

    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V22h-2.4v-2.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H4.5v-2.4h2.34A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V3h2.4v2.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03H23v2.4h-2.04A1.7 1.7 0 0 0 19.4 15Z" />
  </svg>
);

const PayrollIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

const DarkModeIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 12.8A9 9 0 1 1 11.2 3
          7 7 0 0 0 21 12.8Z"
      fill={color}
    />
  </svg>
);

const LightModeIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4" fill={color} />
    <path
      d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const items = [
  ['/dashboard', 'Dashboard', DashboardIcon],
  ['/users', 'Users', UsersIcon],
  ['/guard-verification', 'Guard Verification', GuardIcon],
  ['/shifts', 'Shifts', ShiftIcon],
  ['/payroll', 'Payroll & Timesheets', PayrollIcon],
  ['/incidents', 'Incident Oversight', IncidentIcon],
  ['/roles', 'Roles & Permissions', RolesIcon],
  ['/audit-logs', 'Audit Logs', AuditIcon],
  ['/messages', 'Messages', ChatIcon],
  ['/smtp-settings', 'SMTP Settings', SMTPIcon],
  ['/settings', 'General Settings', SettingsIcon],
  ['/announcements', 'Announcements', ChatIcon],
];

export default function AdminSidebar({ isOpen, onClose }) {
  const { colors } = useTheme();
  const { darkMode, toggleTheme } = useTheme();

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');

    if (saved === null) {
      return true;
    }

    try {
      return JSON.parse(saved);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const showLabels = isOpen || !collapsed;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          className="admin-sidebar-overlay"
          aria-label="Close sidebar"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        />
      )}

      <aside
        className={`admin-sidebar ${isOpen ? 'admin-sidebar-open' : ''}`}
        style={{
          width: showLabels ? 220 : 64,
          background: colors.primaryDark,
          color: colors.white,
          paddingTop: 16,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: colors.white,
            padding: '0 20px',
            display: 'flex',
          }}
        >
          <MenuIcon />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '16px 16.75px 10px',
            gap: '7px',
          }}
        >
          <img
            src="/logo.svg"
            alt="SecureShift Admin"
            style={{
              width: 36,
              height: 36,
            }}
          />

          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              whiteSpace: 'nowrap',
            }}
          >
            {showLabels ? 'SecureShift Admin' : ''}
          </span>
        </div>

        <nav aria-label="Admin navigation">
          {items.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 20px',
                color: isActive
                  ? !darkMode
                    ? colors.primaryDark
                    : colors.text
                  : !darkMode
                    ? colors.white
                    : colors.mutedLight,
                textDecoration: 'none',
                background: isActive ? colors.bg : 'transparent',
              })}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                  }}
                >
                  <Icon />
                </div>
                <span style={{ whiteSpace: 'nowrap' }}>{showLabels ? label : ''}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '10px 20px',
            border: 'none',
            background: 'transparent',
            color: darkMode ? colors.mutedLight : colors.white,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                width: 34,
                height: 24,
                borderRadius: 20,
                background: darkMode ? colors.primary : colors.muted,
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: darkMode ? 13 : 3,
                  top: 3,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: colors.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'left 0.2s ease',
                }}
              >
                {darkMode ? (
                  <DarkModeIcon color={colors.black} />
                ) : (
                  <LightModeIcon color={colors.black} />
                )}
              </span>
            </span>
          </div>

          <span
            style={{
              marginLeft: 16,
              whiteSpace: 'nowrap',
            }}
          >
            {showLabels ? (darkMode ? 'Dark Mode' : 'Light Mode') : ''}
          </span>
        </button>
      </aside>
    </>
  );
}

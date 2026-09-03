import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import colors from '../theme/colors';

const MenuIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512">
    <path
      d="M80 160h352M80 256h352M80 352h352"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeMiterlimit="10"
      strokeWidth="32px"
    />
  </svg>
);

const DashboardIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    rx="20"
    ry="20"
    fill="none"
    stroke={color}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="32px"
  >
    <rect width="176" height="176" x="48" y="48" />
    <rect width="176" height="176" x="288" y="48" />
    <rect width="176" height="176" x="48" y="288" />
    <rect width="176" height="176" x="288" y="288" />
  </svg>
);

const UsersIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="none"
    stroke={color}
    strokeWidth="32px"
  >
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
      d="M18.3499 11.7749C18.4865 11.6335 18.5621 11.444 18.5604 11.2474C18.5587 11.0507 18.4798 10.8626 18.3408 10.7236C18.2017 10.5845 18.0136 10.5056 17.8169 10.5039C17.6203 10.5022 17.4308 10.5778 17.2894 10.7144L11.8144 16.1894L9.33939 13.7144C9.19794 13.5778 9.00849 13.5022 8.81184 13.5039C8.61519 13.5056 8.42709 13.5845 8.28803 13.7236C8.14897 13.8626 8.0701 14.0507 8.06839 14.2474C8.06668 14.444 8.14227 14.6335 8.27889 14.7749L11.2789 17.7749C11.4195 17.9155 11.6103 17.9945 11.8091 17.9945C12.008 17.9945 12.1987 17.9155 12.3394 17.7749L18.3394 11.7749H18.3499Z"
      fill={color}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.61955 3.03C6.77008 2.58432 7.05652 2.19703 7.43859 1.92258C7.82065 1.64814 8.27913 1.50035 8.74955 1.5H9.15155C9.67055 0.603 10.6395 0 11.7465 0H13.2465C14.3565 0 15.3315 0.603 15.8415 1.5H16.2435C16.714 1.50035 17.1724 1.64814 17.5545 1.92258C17.9366 2.19703 18.223 2.58432 18.3735 3.03C19.317 3.081 19.9785 3.1995 20.5335 3.4845C21.3782 3.91746 22.0656 4.60481 22.4985 5.4495C22.989 6.4125 22.989 7.6695 22.989 10.1895V16.7895C22.989 19.3095 22.989 20.5695 22.4985 21.5295C22.0673 22.3754 21.3795 23.0632 20.5335 23.4945C19.5705 23.985 18.3135 23.985 15.7935 23.985H9.19355C6.67355 23.985 5.41355 23.985 4.45355 23.4945C3.60764 23.0632 2.91983 22.3754 2.48855 21.5295C1.99805 20.5665 1.99805 19.3095 1.99805 16.7895V10.1895C1.99805 7.6695 1.99805 6.4095 2.48855 5.4495C2.9215 4.60481 3.60886 3.91746 4.45355 3.4845C5.01155 3.201 5.66855 3.081 6.61355 3.03H6.61955ZM9.58955 2.994C9.7212 2.994 9.85053 2.95934 9.96454 2.89351C10.0785 2.82769 10.1732 2.73301 10.239 2.619L10.455 2.244C10.5866 2.01548 10.7761 1.82568 11.0045 1.69375C11.2328 1.56181 11.4918 1.4924 11.7555 1.4925H13.2555C13.5191 1.49224 13.7781 1.56143 14.0064 1.6931C14.2347 1.82476 14.4243 2.01426 14.556 2.2425L14.772 2.6175C14.8379 2.73151 14.9325 2.82619 15.0466 2.89201C15.1606 2.95784 15.2899 2.9925 15.4215 2.9925H16.2555C16.4545 2.9925 16.6452 3.07152 16.7859 3.21217C16.9265 3.35282 17.0055 3.54359 17.0055 3.7425V5.2425C17.0055 5.44141 16.9265 5.63218 16.7859 5.77283C16.6452 5.91348 16.4545 5.9925 16.2555 5.9925H8.75555C8.55663 5.9925 8.36587 5.91348 8.22522 5.77283C8.08456 5.63218 8.00555 5.44141 8.00555 5.2425V3.7425C8.00555 3.54359 8.08456 3.35282 8.22522 3.21217C8.36587 3.07152 8.55663 2.9925 8.75555 2.9925L9.58955 2.994ZM6.49955 4.539L6.36605 4.548C5.70905 4.602 5.37155 4.6995 5.13755 4.818C4.57309 5.10562 4.11416 5.56454 3.82655 6.129C3.70655 6.363 3.60905 6.7005 3.55655 7.359C3.50105 8.034 3.49955 8.904 3.49955 10.194V16.794C3.49955 18.078 3.50105 18.954 3.55655 19.629C3.61055 20.2845 3.70805 20.622 3.82655 20.856C4.11455 21.42 4.57355 21.879 5.13755 22.167C5.37155 22.287 5.70905 22.3845 6.36605 22.437C7.04105 22.4925 7.91105 22.494 9.20105 22.494H15.801C17.0865 22.494 17.961 22.4925 18.636 22.437C19.293 22.383 19.6305 22.287 19.8645 22.167C20.4285 21.879 20.8875 21.42 21.1755 20.856C21.2955 20.622 21.393 20.286 21.4455 19.6275C21.501 18.9525 21.5025 18.0825 21.5025 16.7925V10.1925C21.5025 8.907 21.501 8.0325 21.4455 7.3575C21.3915 6.7005 21.294 6.363 21.1755 6.129C20.8879 5.56454 20.429 5.10562 19.8645 4.818C19.6305 4.698 19.293 4.6005 18.636 4.548L18.5025 4.539V5.2425C18.5025 5.83924 18.2655 6.41153 17.8435 6.83349C17.4216 7.25545 16.8493 7.4925 16.2525 7.4925H8.75255C8.15581 7.4925 7.58351 7.25545 7.16156 6.83349C6.7396 6.41153 6.50255 5.83924 6.50255 5.2425V4.5375L6.49955 4.539Z"
      fill={color}
    />
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
    strokeWidth="32px"
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
    strokeWidth="32px"
  >
    <rect width="416" height="320" x="48" y="96" rx="40" ry="40" />
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

const items = [
  ['/dashboard', 'Dashboard', DashboardIcon],
  ['/users', 'Users', UsersIcon],
  ['/guard-verification', 'Guard Verification', GuardIcon],
  ['/shifts', 'Shifts', ShiftIcon],
  ['/roles', 'Roles & Permissions', RolesIcon],
  ['/audit-logs', 'Audit Logs', AuditIcon],
  ['/messages', 'Messages', ChatIcon],
  ['/smtp-settings', 'SMTP Settings', SMTPIcon],
];

export default function AdminSidebar({ isOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Mobile drawer hamesha full-width khulni chahiye, chahe desktop collapse state kuch bhi ho
  const showLabels = isOpen || !collapsed;

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="admin-sidebar-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
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
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
          <img src={'/logo.svg'} alt={'SecureShift Admin'} style={{ width: 36, height: 36 }} />
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              opacity: showLabels ? 1 : 0,
              whiteSpace: 'nowrap',
            }}
          >
            SecureShift Admin
          </span>
        </div>
        <nav>
          {items.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 20px',
                color: isActive ? colors.primaryDark : colors.white,
                textDecoration: 'none',
                background: isActive ? colors.bg : 'transparent',
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flexShrink: 0, display: 'flex' }}>
                  <Icon />
                </div>
                <span style={{ opacity: showLabels ? 1 : 0, whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

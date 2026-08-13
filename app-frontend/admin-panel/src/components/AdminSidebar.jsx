import { NavLink } from 'react-router-dom';

const items = [
  ['/dashboard', 'Dashboard'],
  ['/users', 'Users'],
  ['/guard-verification', 'Guard Verification'],
  ['/shifts', 'Shifts'],
  ['/audit-logs', 'Audit Logs'],
  ['/messages', 'Messages'],
  ['/smtp-settings', 'SMTP Settings'],
];

export default function AdminSidebar({ isOpen, onClose }) {
  return (
    <>
      {}
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
          width: 220,
          background: '#18284f',
          color: '#fff',
          paddingTop: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 20px 16px', fontWeight: 700, fontSize: 18 }}>
          SecureShift Admin
        </div>
        <nav>
          {items.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 20px',
                color: '#fff',
                textDecoration: 'none',
                background: isActive ? '#274b93' : 'transparent',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
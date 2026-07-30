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

export default function AdminSidebar() {
  return (
    <aside style={{ width: 220, background: '#18284f', color: '#fff', paddingTop: 16 }}>
      <div style={{ padding: '0 20px 16px', fontWeight: 700, fontSize: 18 }}>SecureShift Admin</div>
      <nav>
        {items.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
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
  );
}

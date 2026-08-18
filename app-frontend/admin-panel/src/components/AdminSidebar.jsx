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
    <aside
      style={{
        width: 220,
        background: '#072261',
        color: '#fff',
        paddingTop: 16,
        flexShrink: 0,
      }}
    >
      <nav>
        {items.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'block',
              padding: '12px 20px',
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

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const ShiftIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M7 3v4M17 3v4M3 10h18" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const GuardIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle
      cx="12"
      cy="8"
      r="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const TimesheetIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M12 7v5l3 2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const MonitoringIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 19V9M10 19V5M16 19v-7M22 19V3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const PayrollIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M3 9h18M8 14h4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="m4 7 8 6 8-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export default function Sidebar({ collapsed, onToggle }) {
  const { t } = useTranslation();

  const navigationItems = [
    {
      label: t('home'),
      path: '/employer-dashboard',
      icon: <HomeIcon />,
    },
    {
      label: t('shifts'),
      path: '/manage-shift',
      icon: <ShiftIcon />,
    },
    {
      label: t('guard'),
      path: '/guard-profiles',
      icon: <GuardIcon />,
    },
    {
      label: t('timesheet'),
      path: '/timesheet',
      icon: <TimesheetIcon />,
    },
    {
      label: t('dailyMonitoring'),
      path: '/daily-monitoring',
      icon: <MonitoringIcon />,
    },
    {
      label: t('payroll'),
      path: '/payroll',
      icon: <PayrollIcon />,
    },
  ];

  if (localStorage.getItem('userRole') === 'admin') {
    navigationItems.push({
      label: t('email'),
      path: '/email-settings',
      icon: <EmailIcon />,
    });
  }

  return (
    <aside
      className={`ss-sidebar ${collapsed ? 'ss-sidebar--collapsed' : ''}`}
    >
      <button
        type="button"
        className="ss-sidebar__toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span
          className={`ss-sidebar__toggle-icon ${
            collapsed ? 'is-collapsed' : ''
          }`}
        >
          ‹
        </span>

        {!collapsed && (
          <span className="ss-sidebar__toggle-text">
            Collapse
          </span>
        )}
      </button>

      <nav className="ss-sidebar__nav" aria-label="Employer navigation">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `ss-sidebar__link ${isActive ? 'is-active' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="ss-sidebar__icon">{item.icon}</span>

            {!collapsed && (
              <span className="ss-sidebar__label">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CompanyLogo from './company_logo.svg';
import ProfilePicPlaceHolder from './ProfilePicPlaceHolder.svg';
import NotificationsPopup from '../pages/NotificationsPopup';
import translations from "../i18n/translations";
import Logo from '../pages/logo.png';

export default function Header({ language, setLanguage }) {
  const t = translations[language || "en"] || translations.en;

  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const headerStyle = {
    backgroundColor: '#072261',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: 'white',
    padding: '0px 20px',
    height: '70px',
  };

  const navButtonStyle = {
    borderRadius: '30px',
    width: '127px',
    height: '42px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'white',
    backgroundColor: '#274B93',
    transition: 'background-color 0.3s',
    cursor: 'pointer',
  };

  const handleHomeClick = () => {
    const token = localStorage.getItem('token');
    navigate(token ? '/employer-dashboard' : '/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <div style={headerStyle}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={CompanyLogo} alt="Company Logo" style={{ height: '66px' }} />
        <div style={{ fontWeight: '600', fontSize: '24px' }}>
          Secure Shift
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        <div onClick={handleHomeClick} style={navButtonStyle}>
          {t.home}
        </div>

        <Link to="/manage-shift" style={navButtonStyle}>
          {t.shifts}
        </Link>

        <Link to="/guard-profiles" style={navButtonStyle}>
          {t.guard}
        </Link>

        <Link to="/timesheet" style={navButtonStyle}>
          {t.timesheet}
        </Link>

        <Link to="/daily-monitoring" style={navButtonStyle}>
        {t.dailyMonitoring}
        </Link>

        <Link to="/timesheet" style={navButtonStyle}>
          Timesheet
        </Link>

        {localStorage.getItem('userRole') === 'admin' && (
          <Link to="/email-settings" style={navButtonStyle}>
            {t.email}
          </Link>
        )}

        <NotificationsPopup />

        {/* Avatar + Dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowMenu(!showMenu)}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={ProfilePicPlaceHolder}
              alt="Profile"
              style={{ height: '60px', marginLeft: '10px' }}
            />
          </div>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '70px',
                width: '220px',
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                zIndex: 1000,
              }}
            >
              {/* Profile Section */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderBottom: '1px solid #eee',
                }}
              >
                <img
                  src={Logo}
                  alt="Profile"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                  }}
                />

                <div>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '15px',
                      color: '#111',
                    }}
                  >
                    ABC Security
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      color: '#666',
                      marginTop: '2px',
                    }}
                  >
                    {localStorage.getItem('email') || 'User'}
                  </div>
                </div>
              </div>

              {/* Language Section */}
              <div style={{ padding: '14px 16px' }}>
                <div
                  style={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '10px',
                    color: '#111',
                  }}
                >
                  🌐 Language
                </div>

                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'Hindi' },
                  { code: 'pa', label: 'Punjabi' },
                  { code: 'zh', label: 'Chinese' },
                ].map((item) => (
                  <div
                    key={item.code}
                    onClick={() => setLanguage(item.code)}
                    style={{
                      padding: '7px 0',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color:
                        language === item.code ? '#274B93' : '#333',
                      fontWeight:
                        language === item.code ? '700' : '400',
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Logout */}
              <div
                onClick={handleLogout}
                style={{
                  padding: '14px 16px',
                  borderTop: '1px solid #eee',
                  cursor: 'pointer',
                  color: 'red',
                  fontWeight: '600',
                }}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
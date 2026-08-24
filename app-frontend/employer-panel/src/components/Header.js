import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import CompanyLogo from './company_logo.svg';
import ProfilePicPlaceHolder from './ProfilePicPlaceHolder.svg';

import NotificationsPopup from '../pages/NotificationsPopup';

import { useTranslation } from 'react-i18next';

import Logo from '../pages/logo.png';

export default function Header({ theme, setTheme }) {
  const { t, i18n } = useTranslation();

  console.log('Language:', i18n.language);
  console.log('Home translation:', t('home'));

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

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);

    localStorage.setItem('language', language);

    window.location.reload();
  };

  const changeTheme = (selectedTheme) => {
    setTheme(selectedTheme);

    localStorage.setItem('theme', selectedTheme);
  };

  return (
    <div style={headerStyle}>
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <img src={CompanyLogo} alt="Company Logo" style={{ height: '66px' }} />

        <div
          style={{
            fontWeight: '600',
            fontSize: '24px',
          }}
        >
          Secure Shift
        </div>
      </div>

      {/* Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div onClick={handleHomeClick} style={navButtonStyle}>
          {t('home')}
        </div>

        <Link to="/manage-shift" style={navButtonStyle}>
          {t('shifts')}
        </Link>

        <Link to="/guard-profiles" style={navButtonStyle}>
          {t('guard')}
        </Link>

        <Link to="/timesheet" style={navButtonStyle}>
          {t('timesheet')}
        </Link>

        <Link to="/daily-monitoring" style={navButtonStyle}>
          {t('dailyMonitoring')}
        </Link>

        <Link to="/payroll" style={navButtonStyle}>
          {t('payroll')}
        </Link>

        {localStorage.getItem('userRole') === 'admin' && (
          <Link to="/email-settings" style={navButtonStyle}>
            {t('email')}
          </Link>
        )}

        <NotificationsPopup />

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setShowMenu(!showMenu)} style={{ cursor: 'pointer' }}>
            <img
              src={ProfilePicPlaceHolder}
              alt="Profile"
              style={{
                height: '60px',
                marginLeft: '10px',
              }}
            />
          </div>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '70px',
                width: '220px',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                borderRadius: '16px',
                boxShadow: '0 6px 18px var(--shadow)',
                overflow: 'hidden',
                zIndex: 1000,
              }}
            >
              {/* Profile Section */}
              <div
                onClick={() => {
                  navigate('/company-profile');
                  setShowMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: '#072261',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={Logo}
                  alt="Profile"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    objectFit: 'contain',
                    backgroundColor: '#fff',
                    padding: '4px',
                  }}
                />

                <div>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '15px',
                      color: '#fff',
                    }}
                  >
                    ABC Security
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      color: '#dbeafe',
                    }}
                  >
                    {localStorage.getItem('email') || 'User'}
                  </div>
                </div>
              </div>

              {/* Language */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '10px',
                    color: 'var(--text-primary)',
                  }}
                >
                  🌐 {t('language')}
                </div>

                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'Hindi' },
                  { code: 'pa', label: 'Punjabi' },
                  { code: 'zh', label: 'Chinese' },
                ].map((item) => (
                  <div
                    key={item.code}
                    onClick={() => changeLanguage(item.code)}
                    style={{
                      padding: '7px 0',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: i18n.language === item.code ? '#274B93' : 'var(--text-primary)',
                      fontWeight: i18n.language === item.code ? '700' : '400',
                      borderBottom: i18n.language === item.code ? '2px solid #274B93' : 'none',
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Appearance */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '10px',
                    color: 'var(--text-primary)',
                  }}
                >
                  🎨 Appearance
                </div>

                <div
                  onClick={() => changeTheme('light')}
                  style={{
                    padding: '7px 0',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: theme === 'light' ? '#274B93' : 'var(--text-primary)',
                    fontWeight: theme === 'light' ? '700' : '400',
                    borderBottom: theme === 'light' ? '2px solid #274B93' : 'none',
                  }}
                >
                  Light Mode
                </div>

                <div
                  onClick={() => changeTheme('dark')}
                  style={{
                    padding: '7px 0',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: theme === 'dark' ? '#274B93' : 'var(--text-primary)',
                    fontWeight: theme === 'dark' ? '700' : '400',
                    borderBottom: theme === 'dark' ? '2px solid #274B93' : 'none',
                  }}
                >
                  Dark Mode
                </div>
              </div>

              {/* Logout */}
              <div
                onClick={handleLogout}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  color: 'var(--danger)',
                  fontWeight: '600',
                }}
              >
                {t('logout')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

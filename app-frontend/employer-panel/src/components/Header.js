import React, { useState, useEffect } from 'react';
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
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (!mobile) setShowMobileNav(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const headerStyle = {
    backgroundColor: '#072261',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: 'white',
    padding: '0px 20px',
    minHeight: '70px',
    flexWrap: 'wrap',
    position: 'relative',
  };

  const navButtonStyle = {
    borderRadius: '30px',
    minWidth: '100px',
    padding: '0 16px',
    height: '42px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'white',
    backgroundColor: '#274B93',
    transition: 'background-color 0.3s',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  const mobileNavButtonStyle = {
    ...navButtonStyle,
    minWidth: 'auto',
    width: '100%',
    margin: '4px 0',
  };

  const hamburgerStyle = {
    display: isMobile ? 'flex' : 'none',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '28px',
    height: '20px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  };

  const hamburgerBarStyle = {
    width: '100%',
    height: '3px',
    backgroundColor: 'white',
    borderRadius: '2px',
  };

  const handleHomeClick = () => {
    const token = localStorage.getItem('token');

    navigate(token ? '/employer-dashboard' : '/login');
    setShowMobileNav(false);
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

  const navLinks = [
    { key: 'home', label: t("home"), onClick: handleHomeClick, isDiv: true },
    { key: 'shifts', label: t("shifts"), to: '/manage-shift' },
    { key: 'guard', label: t("guard"), to: '/guard-profiles' },
    { key: 'timesheet', label: t("timesheet"), to: '/timesheet' },
    { key: 'dailyMonitoring', label: t("dailyMonitoring"), to: '/daily-monitoring' },
    { key: 'payroll', label: t("payroll"), to: '/payroll' },
  ];

  if (localStorage.getItem('userRole') === 'admin') {
    navLinks.push({ key: 'email', label: t("email"), to: '/email-settings' });
  }

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

      {/* Desktop Navigation */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {navLinks.map((link) =>
            link.isDiv ? (
              <div key={link.key} onClick={link.onClick} style={navButtonStyle}>
                {link.label}
              </div>
            ) : (
              <Link key={link.key} to={link.to} style={navButtonStyle}>
                {link.label}
              </Link>
            )
          )}

          <NotificationsPopup />

          <ProfileMenu
            showMenu={showMenu}
            setShowMenu={setShowMenu}
            navigate={navigate}
            handleLogout={handleLogout}
            changeLanguage={changeLanguage}
            changeTheme={changeTheme}
            theme={theme}
            i18n={i18n}
            t={t}
          />
        </div>
      )}

      {/* Mobile: hamburger + notifications + profile */}
      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationsPopup />

          <ProfileMenu
            showMenu={showMenu}
            setShowMenu={setShowMenu}
            navigate={navigate}
            handleLogout={handleLogout}
            changeLanguage={changeLanguage}
            changeTheme={changeTheme}
            theme={theme}
            i18n={i18n}
            t={t}
          />

          <button
            style={hamburgerStyle}
            onClick={() => setShowMobileNav(!showMobileNav)}
            aria-label="Toggle navigation"
          >
            <div style={hamburgerBarStyle} />
            <div style={hamburgerBarStyle} />
            <div style={hamburgerBarStyle} />
          </button>
        </div>
      )}

      {/* Mobile dropdown nav */}
      {isMobile && showMobileNav && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 0',
            borderTop: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {navLinks.map((link) =>
            link.isDiv ? (
              <div
                key={link.key}
                onClick={() => {
                  link.onClick();
                  setShowMobileNav(false);
                }}
                style={mobileNavButtonStyle}
              >
                {link.label}
              </div>
            ) : (
              <Link
                key={link.key}
                to={link.to}
                style={mobileNavButtonStyle}
                onClick={() => setShowMobileNav(false)}
              >
                {link.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

function ProfileMenu({ showMenu, setShowMenu, navigate, handleLogout, changeLanguage, changeTheme, theme, i18n, t }) {
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setShowMenu(!showMenu)} style={{ cursor: 'pointer' }}>
        <img
          src={ProfilePicPlaceHolder}
          alt="Profile"
          style={{ height: '48px', marginLeft: '4px' }}
        />
      </div>

      {showMenu && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '58px',
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

          <div
            onClick={handleLogout}
            style={{
              padding: '14px 16px',
              borderTop: '1px solid var(--border)',
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
  );
}
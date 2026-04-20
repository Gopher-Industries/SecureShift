import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CompanyLogo from './company_logo.svg';
import ProfilePicPlaceHolder from './ProfilePicPlaceHolder.svg';
import NotificationsPopup from '../pages/NotificationsPopup';

export default function Header() {
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
        <div style={{ fontWeight: '600', fontSize: '24px' }}>Secure Shift</div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div onClick={handleHomeClick} style={navButtonStyle}>
          Home
        </div>

        <Link to="/manage-shift" style={navButtonStyle}>
          Shifts
        </Link>

        <Link to="/guard-profiles" style={navButtonStyle}>
          Guard
        </Link>

        <Link to="/timesheet" style={navButtonStyle}>
          Timesheet
        </Link>

        {localStorage.getItem('userRole') === 'admin' && (
          <Link to="/email-settings" style={navButtonStyle}>
            Email
          </Link>
        )}

        <NotificationsPopup />

        {/* Avatar + Dropdown */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setShowMenu(!showMenu)} style={{ cursor: 'pointer' }}>
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
                background: 'white',
                color: 'black',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                minWidth: '140px',
                zIndex: 1000,
              }}
            >
              <div
                style={{ padding: '8px', cursor: 'pointer' }}
                onClick={() => {
                  navigate('/company-profile');
                  setShowMenu(false);
                }}
              >
                Profile
              </div>

              <div
                style={{ padding: '8px', cursor: 'pointer', color: 'red' }}
                onClick={handleLogout}
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
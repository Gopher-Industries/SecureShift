// src/components/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CompanyLogo from './company_logo.svg'; // Replace with actual logo path

export default function Header() {
  const navigate = useNavigate();

  return (
    <header style={styles.header}>
      {/* Logo and Name */}
      <div style={styles.logoContainer}>
        <img src={CompanyLogo} alt="Logo" style={styles.logo} />
        <span style={styles.logoText}>Secure Shift</span>
      </div>

      {/* Navigation Buttons */}
      <nav style={styles.nav}>
        <Link to="/" style={styles.navItem}>Home</Link>
        <Link to="/manage-shift" style={styles.navItem}>Shifts</Link>
        <Link to="/guard-profiles" style={styles.navItem}>Guard</Link>
      </nav>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: '#072261',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    height: '60px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    height: '42px',
  },
  logoText: {
    fontWeight: '600',
    fontSize: '20px',
  },
  nav: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
    navItem: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '14px',
    padding: '0',            
    backgroundColor: 'none', 
    borderRadius: '0',       
  },
};

import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.updated}>Last updated: April 2026</p>

        <p style={styles.paragraph}>
          SecureShift is a shift management platform designed to connect employers with security
          guards and support the management of shifts, timesheets, availability, and related
          workplace communication. This Privacy Policy explains how SecureShift may collect, use,
          and protect information when users access the platform.
        </p>

        <h2 style={styles.heading}>Information We Collect</h2>
        <p style={styles.paragraph}>
          SecureShift may collect information such as names, email addresses, employer details,
          guard profiles, shift details, site locations, availability, timesheet records, clock-in
          and clock-out information, incident reports, and account login details.
        </p>

        <h2 style={styles.heading}>How We Use Information</h2>
        <p style={styles.paragraph}>
          The information collected is used to manage accounts, organise shifts, support timesheet
          and attendance tracking, improve communication between employers and guards, and maintain
          the overall functionality of the platform.
        </p>

        <h2 style={styles.heading}>Data Security</h2>
        <p style={styles.paragraph}>
          SecureShift aims to protect user information through appropriate security practices,
          including authentication, access control, and responsible data handling. Users are
          responsible for keeping their login details secure.
        </p>

        <h2 style={styles.heading}>Sharing of Information</h2>
        <p style={styles.paragraph}>
          Information may be shared between relevant users of the platform, such as employers and
          guards, where required for shift management, timesheet processing, incident reporting, or
          operational communication.
        </p>

        <h2 style={styles.heading}>User Responsibilities</h2>
        <p style={styles.paragraph}>
          Users should provide accurate information, protect their account access, and notify the
          SecureShift team if they suspect unauthorised access or misuse of their account.
        </p>

        <h2 style={styles.heading}>Contact</h2>
        <p style={styles.paragraph}>
          For questions about this Privacy Policy, users may contact the SecureShift project team.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: '#f7f7f7',
    minHeight: '100vh',
    padding: '40px 20px',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '32px',
    marginBottom: '8px',
    color: '#072261',
  },
  updated: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '28px',
  },
  heading: {
    fontSize: '20px',
    marginTop: '28px',
    marginBottom: '10px',
    color: '#072261',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#222',
  },
};

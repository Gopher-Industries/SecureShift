import React from 'react';

export default function TermsAndConditions() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Terms and Conditions</h1>
        <p style={styles.updated}>Last updated: April 2026</p>

        <p style={styles.paragraph}>
          These Terms and Conditions outline the expected use of the SecureShift platform.
          SecureShift supports employers and security guards by providing tools for shift
          management, availability, timesheets, attendance tracking, and workplace communication.
        </p>

        <h2 style={styles.heading}>Use of the Platform</h2>
        <p style={styles.paragraph}>
          Users must use SecureShift responsibly and only for legitimate employment, security, shift
          management, and workplace coordination purposes.
        </p>

        <h2 style={styles.heading}>Employer Responsibilities</h2>
        <p style={styles.paragraph}>
          Employers are responsible for providing accurate shift details, including shift dates,
          times, locations, pay rates, and job requirements. Employers should also review timesheets
          and incident information responsibly.
        </p>

        <h2 style={styles.heading}>Guard Responsibilities</h2>
        <p style={styles.paragraph}>
          Security guards are responsible for providing accurate availability, attending assigned
          shifts, recording correct timesheet information, and reporting incidents honestly where
          required.
        </p>

        <h2 style={styles.heading}>Account Security</h2>
        <p style={styles.paragraph}>
          Users must keep their login details secure and must not share accounts with others. Users
          should immediately report suspected unauthorised access or misuse of their account.
        </p>

        <h2 style={styles.heading}>Acceptable Use</h2>
        <p style={styles.paragraph}>
          Users must not misuse the platform, attempt to access unauthorised data, interfere with
          system functionality, or use SecureShift for unlawful or harmful purposes.
        </p>

        <h2 style={styles.heading}>Platform Updates</h2>
        <p style={styles.paragraph}>
          SecureShift may update features, content, and terms as the platform develops. Continued
          use of the platform means users accept the updated terms.
        </p>

        <h2 style={styles.heading}>Limitation of Responsibility</h2>
        <p style={styles.paragraph}>
          SecureShift aims to support effective shift coordination, but users remain responsible for
          verifying information, communicating clearly, and meeting their workplace obligations.
        </p>

        <h2 style={styles.heading}>Contact</h2>
        <p style={styles.paragraph}>
          For questions about these Terms and Conditions, users may contact the SecureShift project
          team.
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

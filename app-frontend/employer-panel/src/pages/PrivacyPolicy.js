import React from 'react';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <h1 className="privacy-title">Privacy Policy</h1>

        <p className="privacy-updated">Last updated: April 2026</p>

        <p className="privacy-paragraph">
          SecureShift is a shift management platform designed to connect employers with security
          guards and support the management of shifts, timesheets, availability, and related
          workplace communication. This Privacy Policy explains how SecureShift may collect, use,
          and protect information when users access the platform.
        </p>

        <h2 className="privacy-heading">Information We Collect</h2>

        <p className="privacy-paragraph">
          SecureShift may collect information such as names, email addresses, employer details,
          guard profiles, shift details, site locations, availability, timesheet records, clock-in
          and clock-out information, incident reports, and account login details.
        </p>

        <h2 className="privacy-heading">How We Use Information</h2>

        <p className="privacy-paragraph">
          The information collected is used to manage accounts, organise shifts, support timesheet
          and attendance tracking, improve communication between employers and guards, and maintain
          the overall functionality of the platform.
        </p>

        <h2 className="privacy-heading">Data Security</h2>

        <p className="privacy-paragraph">
          SecureShift aims to protect user information through appropriate security practices,
          including authentication, access control, and responsible data handling. Users are
          responsible for keeping their login details secure.
        </p>

        <h2 className="privacy-heading">Sharing of Information</h2>

        <p className="privacy-paragraph">
          Information may be shared between relevant users of the platform, such as employers and
          guards, where required for shift management, timesheet processing, incident reporting, or
          operational communication.
        </p>

        <h2 className="privacy-heading">User Responsibilities</h2>

        <p className="privacy-paragraph">
          Users should provide accurate information, protect their account access, and notify the
          SecureShift team if they suspect unauthorised access or misuse of their account.
        </p>

        <h2 className="privacy-heading">Contact</h2>

        <p className="privacy-paragraph">
          For questions about this Privacy Policy, users may contact the SecureShift project team.
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import './TermsAndConditions.css';

export default function TermsAndConditions() {
  return (
    <div className="tc-page">
      <div className="tc-container">
        <h1 className="tc-title">Terms and Conditions</h1>
        <p className="tc-updated">Last updated: April 2026</p>

        <p className="tc-paragraph">
          These Terms and Conditions outline the expected use of the SecureShift platform.
          SecureShift supports employers and security guards by providing tools for shift
          management, availability, timesheets, attendance tracking, and workplace communication.
        </p>

        <h2 className="tc-heading">Use of the Platform</h2>
        <p className="tc-paragraph">
          Users must use SecureShift responsibly and only for legitimate employment, security, shift
          management, and workplace coordination purposes.
        </p>

        <h2 className="tc-heading">Employer Responsibilities</h2>
        <p className="tc-paragraph">
          Employers are responsible for providing accurate shift details, including shift dates,
          times, locations, pay rates, and job requirements. Employers should also review timesheets
          and incident information responsibly.
        </p>

        <h2 className="tc-heading">Guard Responsibilities</h2>
        <p className="tc-paragraph">
          Security guards are responsible for providing accurate availability, attending assigned
          shifts, recording correct timesheet information, and reporting incidents honestly where
          required.
        </p>

        <h2 className="tc-heading">Account Security</h2>
        <p className="tc-paragraph">
          Users must keep their login details secure and must not share accounts with others. Users
          should immediately report suspected unauthorised access or misuse of their account.
        </p>

        <h2 className="tc-heading">Acceptable Use</h2>
        <p className="tc-paragraph">
          Users must not misuse the platform, attempt to access unauthorised data, interfere with
          system functionality, or use SecureShift for unlawful or harmful purposes.
        </p>

        <h2 className="tc-heading">Platform Updates</h2>
        <p className="tc-paragraph">
          SecureShift may update features, content, and terms as the platform develops. Continued
          use of the platform means users accept the updated terms.
        </p>

        <h2 className="tc-heading">Limitation of Responsibility</h2>
        <p className="tc-paragraph">
          SecureShift aims to support effective shift coordination, but users remain responsible for
          verifying information, communicating clearly, and meeting their workplace obligations.
        </p>

        <h2 className="tc-heading">Contact</h2>
        <p className="tc-paragraph">
          For questions about these Terms and Conditions, users may contact the SecureShift project
          team.
        </p>
      </div>
    </div>
  );
}

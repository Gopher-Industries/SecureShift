import React from 'react';
import './FAQs.css';

export default function FAQs() {
  return (
    <div className="faq-page">
      <main className="faq-container">
        <header className="faq-header">
          <p className="faq-eyebrow">SecureShift Help Centre</p>
          <h1>Frequently Asked Questions</h1>
          <p className="faq-introduction">
            Find answers to common questions about SecureShift, including account
            access, shift management, timesheets, attendance, and incident reporting.
          </p>
        </header>

        <section className="faq-content" aria-labelledby="faq-section-title">
          <div className="faq-section-heading">
            <h2 id="faq-section-title">Common questions</h2>
            <p>
              Select a question to view more information. Interactive FAQ items
              will be added as part of the next development task.
            </p>
          </div>

          <div className="faq-placeholder-list">
            <article className="faq-placeholder-item">
              <h3>How do employers create and manage shifts?</h3>
              <p>
                Employers can create, review, and manage shifts through the
                SecureShift Employer Panel.
              </p>
            </article>

            <article className="faq-placeholder-item">
              <h3>How are guard attendance and timesheets recorded?</h3>
              <p>
                Attendance and timesheet information is recorded through the
                SecureShift platform and displayed in the relevant employer views.
              </p>
            </article>

            <article className="faq-placeholder-item">
              <h3>How can users report an issue or incident?</h3>
              <p>
                Guards and employers can use SecureShift incident-reporting
                functionality to record and review workplace incidents.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
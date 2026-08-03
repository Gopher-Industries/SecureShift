import React from 'react';
import FAQItem from '../components/FAQItem';
import './FAQs.css';

const faqData = [
  {
    id: 1,
    question: 'How do employers create and manage shifts?',
    answer:
      'Employers can create, review, edit, and manage shifts through the SecureShift Employer Panel. Shift details may include the date, time, location, required role, pay rate, and number of guards needed.',
  },
  {
    id: 2,
    question: 'How can employers assign guards to shifts?',
    answer:
      'Employers can review available guards and assign suitable team members to shifts through the shift management area. Assignment options may depend on availability, role requirements, and existing schedules.',
  },
  {
    id: 3,
    question: 'How are guard attendance and timesheets recorded?',
    answer:
      'Attendance information is recorded through guard clock-in and clock-out activity. Employers can review timesheets, total worked hours, attendance status, and other shift-related records from the Employer Panel.',
  },
  {
    id: 4,
    question: 'What happens if a guard is late or absent?',
    answer:
      'Late or absent attendance may be reflected in the Timesheet page using status indicators. Employers can review attendance records and follow up with the relevant guard where necessary.',
  },
  {
    id: 5,
    question: 'How can users report a workplace incident?',
    answer:
      'Guards can submit incident reports through the SecureShift platform. Employers can review submitted incidents, update their status or severity, and add comments or follow-up information where required.',
  },
  {
    id: 6,
    question: 'How does payroll information work in SecureShift?',
    answer:
      'Payroll information may be calculated using completed shift and attendance records. Employers can review worked hours, pay rates, and payroll-related information through the relevant payroll section.',
  },
  {
    id: 7,
    question: 'How do notifications work?',
    answer:
      'SecureShift notifications help users stay informed about important events such as shift applications, schedule updates, incidents, or other workforce activities. Notifications can be viewed through the application interface.',
  },
  {
    id: 8,
    question: 'How can employers update their company profile?',
    answer:
      'Employers can access the company profile section to review and update relevant organisation and account information. Users should ensure all profile details remain accurate and current.',
  },
  {
    id: 9,
    question: 'How is account information kept secure?',
    answer:
      'Users should keep their login details private, avoid sharing accounts, and log out when using shared devices. SecureShift uses authenticated access to help protect restricted areas of the platform.',
  },
  {
    id: 10,
    question: 'Who should users contact if they need further help?',
    answer:
      'Users who cannot find the information they need can use the Contact Us page or communicate with the SecureShift project team for additional support.',
  },
];

export default function FAQs() {
  return (
    <div className="faq-page">
      <main className="faq-container">
        <header className="faq-header">
          <p className="faq-eyebrow">SecureShift Help Centre</p>

          <h1>Frequently Asked Questions</h1>

          <p className="faq-introduction">
            Find answers to common questions about SecureShift, including account
            access, shift management, timesheets, attendance, payroll, notifications,
            and incident reporting.
          </p>
        </header>

        <section className="faq-content" aria-labelledby="faq-section-title">
          <div className="faq-section-heading">
            <h2 id="faq-section-title">Common Questions</h2>

            <p>
              Select a question below to view more information.
            </p>
          </div>

          <div className="faq-list">
            {faqData.map((faq) => (
              <FAQItem
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
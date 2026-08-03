import React from "react";
import "./FAQs.css";
import FAQItem from "../components/FAQItem";
import FAQContactForm from "../components/FAQContactForm";
import PageTitleHandler from "../components/PageTitleHandler";

const faqData = [
  {
    question: "How do employers create and manage shifts?",
    answer:
      "Employers can create, review, edit, and manage shifts through the SecureShift Employer Panel. Shift details may include the date, time, location, required role, pay rate, and number of guards needed.",
  },
  {
    question: "How can employers assign guards to shifts?",
    answer:
      "Employers can review available guards and assign suitable team members to shifts through the shift management area. Assignment options may depend on availability, role requirements, and existing schedules.",
  },
  {
    question: "How are guard attendance and timesheets recorded?",
    answer:
      "Attendance information is recorded through guard clock-in and clock-out activity. Employers can review timesheets, total worked hours, attendance status, and other shift-related records from the Employer Panel.",
  },
  {
    question: "What happens if a guard is late or absent?",
    answer:
      "Late or absent attendance may be reflected in the Timesheet page using status indicators. Employers can review attendance records and follow up with the relevant guard where necessary.",
  },
  {
    question: "How can users report a workplace incident?",
    answer:
      "Guards and employers can submit workplace incident reports through SecureShift. Submitted reports are available for review and follow-up within the Employer Dashboard.",
  },
  {
    question: "How does payroll information work in SecureShift?",
    answer:
      "Payroll information is generated using approved timesheet records. Employers can review work hours before payroll is processed.",
  },
  {
    question: "How do notifications work?",
    answer:
      "SecureShift sends notifications for important updates such as shift assignments, attendance changes, and other system events.",
  },
  {
    question: "How can employers update their company profile?",
    answer:
      "Company information can be managed through the Employer Profile section, where employers can update business details and account information.",
  },
  {
    question: "How is account information kept secure?",
    answer:
      "SecureShift uses authentication and secure session management to help protect user accounts. Users should always keep their login credentials confidential.",
  },
  {
    question: "Who should users contact if they need further help?",
    answer:
      "If additional assistance is required, users should contact the SecureShift support team or their organisation administrator.",
  },
];

function FAQs() {
  return (
    <>
      <PageTitleHandler title="FAQs" />

      <div className="faq-page">
        <div className="faq-container">
          <span className="faq-tag">SECURESHIFT HELP CENTRE</span>

          <h1>Frequently Asked Questions</h1>

          <p className="faq-description">
            Find answers to common questions about SecureShift, including
            account access, shift management, timesheets, attendance, payroll,
            notifications, and incident reporting.
          </p>

          <hr className="faq-divider" />

          <h2>Common Questions</h2>

          <p className="faq-subtitle">
            Select a question below to view more information.
          </p>

          <div className="faq-list">
            {faqData.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>

          <FAQContactForm />
        </div>
      </div>
    </>
  );
}

export default FAQs;
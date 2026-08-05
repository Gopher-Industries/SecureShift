import React, { useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqData.filter((item) => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(lowerCaseQuery) ||
      item.answer.toLowerCase().includes(lowerCaseQuery)
    );
  });

  return (
    <>
      <PageTitleHandler title="FAQs" />

      <div className="faq-page">
        <div className="faq-container">
          <div className="faq-header">
            <span className="faq-tag">SECURESHIFT HELP CENTRE</span>
            <h1>Frequently Asked Questions</h1>
            <p className="faq-description">
              Find answers to common questions about SecureShift, including
              account access, shift management, timesheets, attendance, payroll,
              notifications, and incident reporting.
            </p>
          </div>

          <div className="faq-search-wrapper">
            <svg
              className="faq-search-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="faq-search-input"
              placeholder="Search for an answer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search FAQs"
            />
          </div>

          <hr className="faq-divider" />

          <div className="faq-content-grid">
            <div className="faq-questions-column">
              <h2 className="faq-section-heading">Common Questions</h2>
              <p className="faq-subtitle">
                Select a question below to view more information.
              </p>

              {searchQuery && (
                <div className="faq-result-count">
                  <span className="faq-result-badge">{filteredFaqs.length}</span>
                  <span>
                    {filteredFaqs.length === 1 ? "result" : "results"} found
                  </span>
                </div>
              )}

              <div className="faq-list">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((item, index) => (
                    <FAQItem
                      key={index}
                      question={item.question}
                      answer={item.answer}
                    />
                  ))
                ) : (
                  <div className="faq-no-results">
                    <span className="faq-no-results-icon">🤔</span>
                    <p>No questions found matching "{searchQuery}". Try a different term.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="faq-form-column">
              <FAQContactForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FAQs;
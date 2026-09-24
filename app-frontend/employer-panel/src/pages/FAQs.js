import React, { useState, useEffect } from 'react';
import './FAQs.css';
import FAQItem from '../components/FAQItem';
import FAQContactForm from '../components/FAQContactForm';
import PageTitleHandler from '../components/PageTitleHandler';
import api from '../api/api';

function FAQs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFAQs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get("/faqs");

        if (!isMounted) return;

        setFaqs(response.data || []);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || "An unexpected error occurred.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFAQs();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFaqs = faqs.filter((item) => {
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
              Find answers to common questions about SecureShift, including account access, shift
              management, timesheets, attendance, payroll, notifications, and incident reporting.
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
              <p className="faq-subtitle">Select a question below to view more information.</p>

              {isLoading ? (
                <div className="faq-status-message faq-loading">
                  <div className="faq-spinner"></div>
                  <p>Loading FAQs...</p>
                </div>
              ) : error ? (
                <div className="faq-status-message faq-error">
                  <span className="faq-status-icon">⚠️</span>
                  <p>{error}</p>
                  <button className="faq-retry-btn" onClick={() => window.location.reload()}>
                    Retry
                  </button>
                </div>
              ) : faqs.length === 0 ? (
                <div className="faq-status-message faq-empty">
                  <span className="faq-status-icon">📭</span>
                  <p>No FAQs are currently available.</p>
                </div>
              ) : (
                <>
                  {searchQuery && (
                    <div className="faq-result-count">
                      <span className="faq-result-badge">{filteredFaqs.length}</span>
                      <span>{filteredFaqs.length === 1 ? 'result' : 'results'} found</span>
                    </div>
                  )}

                  <div className="faq-list">
                    {filteredFaqs.length > 0 ? (
                      filteredFaqs.map((item, index) => (
                        <FAQItem key={index} question={item.question} answer={item.answer} />
                      ))
                    ) : (
                      <div className="faq-no-results">
                        <span className="faq-no-results-icon">🤔</span>
                        <p>No questions found matching "{searchQuery}". Try a different term.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
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
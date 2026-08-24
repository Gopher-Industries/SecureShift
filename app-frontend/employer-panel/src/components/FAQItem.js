import React, { useState } from 'react';
import './FAQItem.css';

export default function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFAQ = () => {
    setIsOpen((previousState) => !previousState);
  };

  return (
    <article className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
      <button type="button" className="faq-question" onClick={toggleFAQ} aria-expanded={isOpen}>
        <span className="faq-question-text">{question}</span>

        <span className={`faq-chevron ${isOpen ? 'faq-chevron--open' : ''}`} aria-hidden="true">
          ▼
        </span>
      </button>

      <div className={`faq-answer-wrapper ${isOpen ? 'faq-answer-wrapper--open' : ''}`}>
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      </div>
    </article>
  );
}

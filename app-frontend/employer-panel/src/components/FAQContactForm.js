import React from 'react';
import ContactForm from './ContactForm';
import './FAQContactForm.css';

export default function FAQContactForm() {
  return (
    <section
      className="faq-contact-section"
      aria-labelledby="faq-contact-heading"
    >
      <div className="faq-contact-header">
        <h2 id="faq-contact-heading">Send Us a Message</h2>

        <p>
          Have a question that is not answered above? Complete the form below.
          Backend submission will be connected in a future integration task.
        </p>
      </div>

      <div className="faq-contact-card">
        <ContactForm showSubject={true} submitButtonText="Submit Message" />
      </div>
    </section>
  );
}
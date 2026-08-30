import React, { useState } from 'react';
import './FAQContactForm.css';

export default function FAQContactForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });

  const [notice, setNotice] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (notice) {
      setNotice('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setNotice(
      'Thank you. Contact form submission will be connected in a future backend integration task.'
    );
  };

  return (
    <section className="faq-contact-section" aria-labelledby="faq-contact-heading">
      <div className="faq-contact-header">
        <h2 id="faq-contact-heading">Send Us a Message</h2>

        <p>
          Have a question that is not answered above? Complete the form below. Backend submission
          will be connected in a future integration task.
        </p>
      </div>

      <div className="faq-contact-card">
        <form className="faq-contact-form" onSubmit={handleSubmit}>
          <div className="faq-form-row">
            <div className="faq-form-group">
              <label htmlFor="faq-full-name">Full Name</label>
              <input
                id="faq-full-name"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </div>

            <div className="faq-form-group">
              <label htmlFor="faq-email">Email Address</label>
              <input
                id="faq-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="faq-form-group">
            <label htmlFor="faq-subject">Subject</label>
            <input
              id="faq-subject"
              name="subject"
              type="text"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Enter the subject"
              required
            />
          </div>

          <div className="faq-form-group">
            <label htmlFor="faq-message">Message</label>
            <textarea
              id="faq-message"
              name="message"
              rows="6"
              value={formData.message}
              onChange={handleChange}
              placeholder="Type your message..."
              required
            />
          </div>

          <div className="faq-contact-actions">
            <button type="submit" className="faq-submit-btn">
              Submit Message
            </button>

            <span className="faq-integration-label">Frontend preview only</span>
          </div>

          {notice && (
            <div className="faq-form-notice" role="status">
              {notice}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

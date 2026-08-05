import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import './ContactUs.css';

const IconPhone = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" role="img" {...props}>
    <path
      d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11 21 3 13 3 4.9c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.3 1.1L6.6 10.8z"
      fill="currentColor"
    />
  </svg>
);

const IconMail = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" role="img" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPin = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" role="img" {...props}>
    <path
      d="M12 2c-4 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3-7-7-7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="9" r="2.5" fill="currentColor" />
  </svg>
);

const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" role="img" {...props}>
    <path
      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
      fill="currentColor"
    />
  </svg>
);

const IconAlert = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" role="img" {...props}>
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
      fill="currentColor"
    />
  </svg>
);

const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .trim()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  email: Yup.string()
    .trim()
    .required('Email address is required')
    .email('Please enter a valid email address'),
  phone: Yup.string()
    .trim()
    .test('valid-phone', 'Please enter a valid phone number', (value) => {
      if (!value) return true;
      return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/.test(value);
    }),
  subject: Yup.string()
    .required('Please select an inquiry subject'),
  message: Yup.string()
    .trim()
    .required('Message is required')
    .min(10, 'Message must be at least 10 characters long'),
});

function ContactUs() {
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    setSubmitStatus(null);

    try {
      // Simulated asynchronous submission (Mock API delay)
      // Future API integration: await http.post('/contact', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmitStatus({
        type: 'success',
        primary: `Thank you, ${data.fullName}! Your enquiry has been received.`,
        note: 'Note: This is a frontend prototype. Submission is currently mocked — no message has been sent, emailed, or persisted. Backend integration is planned for a future task.',
      });
      reset();
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        text: 'Failed to send message. Please check your network connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetStatus = () => {
    setSubmitStatus(null);
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>Have a question or need assistance? We'd love to hear from you.</p>
      </div>

      <div className="contact-content">
        {/* Contact Information */}
        <div className="contact-info">
          <h2>Contact Information</h2>

          <div className="info-item">
            <div className="contact-icon">
              <IconPhone />
            </div>
            <div className="info-item-body">
              <h3>Phone</h3>
              <p>+61 3 1234 5678</p>
            </div>
          </div>

          <div className="info-item">
            <div className="contact-icon">
              <IconMail />
            </div>
            <div className="info-item-body">
              <h3>Email</h3>
              <p>support@secureshift.com</p>
            </div>
          </div>

          <div className="info-item">
            <div className="contact-icon">
              <IconPin />
            </div>
            <div className="info-item-body">
              <h3>Address</h3>
              <p>Melbourne, Victoria, Australia</p>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="contact-form-section">
          <h2>Send Us a Message</h2>

          {submitStatus && (
            <div
              className={`contact-alert contact-alert-${submitStatus.type}`}
              role="alert"
              aria-live="polite"
            >
              <div className="alert-icon">
                {submitStatus.type === 'success' ? <IconCheck /> : <IconAlert />}
              </div>
              <div className="alert-content">
                <p className="alert-primary">{submitStatus.primary || submitStatus.text}</p>
                {submitStatus.note && (
                  <p className="alert-note">{submitStatus.note}</p>
                )}
                {submitStatus.type === 'success' && (
                  <button
                    type="button"
                    className="alert-action-btn"
                    onClick={handleResetStatus}
                  >
                    Submit another enquiry
                  </button>
                )}
              </div>
            </div>
          )}

          <form className="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Full Name <span className="required-star">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                className={`form-input ${errors.fullName ? 'is-invalid' : ''}`}
                placeholder="e.g. John Doe"
                disabled={submitting}
                aria-invalid={errors.fullName ? 'true' : 'false'}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                {...register('fullName')}
              />
              {errors.fullName && (
                <span id="fullName-error" className="field-error" role="alert">
                  {errors.fullName.message}
                </span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address <span className="required-star">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className={`form-input ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="e.g. john@example.com"
                  disabled={submitting}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <span id="email-error" className="field-error" role="alert">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number <span className="optional-tag">(Optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={`form-input ${errors.phone ? 'is-invalid' : ''}`}
                  placeholder="e.g. +61 400 123 456"
                  disabled={submitting}
                  aria-invalid={errors.phone ? 'true' : 'false'}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  {...register('phone')}
                />
                {errors.phone && (
                  <span id="phone-error" className="field-error" role="alert">
                    {errors.phone.message}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject" className="form-label">
                Inquiry Subject <span className="required-star">*</span>
              </label>
              <select
                id="subject"
                className={`form-select ${errors.subject ? 'is-invalid' : ''}`}
                disabled={submitting}
                aria-invalid={errors.subject ? 'true' : 'false'}
                aria-describedby={errors.subject ? 'subject-error' : undefined}
                {...register('subject')}
              >
                <option value="">Select a subject...</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Shift Booking Assistance">Shift Booking Assistance</option>
                <option value="Billing & Invoicing">Billing & Invoicing</option>
                <option value="Feedback & Suggestions">Feedback & Suggestions</option>
                <option value="Other">Other</option>
              </select>
              {errors.subject && (
                <span id="subject-error" className="field-error" role="alert">
                  {errors.subject.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label">
                Message <span className="required-star">*</span>
              </label>
              <textarea
                id="message"
                rows={4}
                className={`form-textarea ${errors.message ? 'is-invalid' : ''}`}
                placeholder="How can we help you? Please describe your inquiry in detail..."
                disabled={submitting}
                aria-invalid={errors.message ? 'true' : 'false'}
                aria-describedby={errors.message ? 'message-error' : undefined}
                {...register('message')}
              />
              {errors.message && (
                <span id="message-error" className="field-error" role="alert">
                  {errors.message.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="contact-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  <span>Sending Message...</span>
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;
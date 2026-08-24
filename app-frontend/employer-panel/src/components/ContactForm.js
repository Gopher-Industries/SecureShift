import { useState } from 'react';
import './ContactForm.css';

const EMPTY_FORM = {
  name: '',
  email: '',
  message: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(values) {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();

  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!message) {
    errors.message = 'Message is required.';
  } else if (message.length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  }

  return errors;
}

function ContactForm({
  onSubmit,
  submitButtonText = 'Send Message',
  initialValues = EMPTY_FORM,
  resetOnSuccess = true,
}) {
  const [values, setValues] = useState({
    ...EMPTY_FORM,
    ...initialValues,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const validateSingleField = (fieldName, nextValues) => {
    const validationErrors = validateForm(nextValues);

    setErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: validationErrors[fieldName],
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValues = {
      ...values,
      [name]: value,
    };

    setValues(nextValues);
    setSubmissionStatus(null);

    if (touched[name]) {
      validateSingleField(name, nextValues);
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;

    setTouched((currentTouched) => ({
      ...currentTouched,
      [name]: true,
    }));

    validateSingleField(name, values);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm(values);

    setTouched({
      name: true,
      email: true,
      message: true,
    });
    setErrors(validationErrors);
    setSubmissionStatus(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const submittedValues = {
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    };

    try {
      setIsSubmitting(true);

      if (onSubmit) {
        await onSubmit(submittedValues);
      }

      setSubmissionStatus({
        type: 'success',
        message: 'Your message has been submitted successfully.',
      });

      if (resetOnSuccess) {
        setValues(EMPTY_FORM);
        setTouched({});
        setErrors({});
      }
    } catch (error) {
      setSubmissionStatus({
        type: 'error',
        message: error?.message || 'We could not submit your message. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate aria-label="Contact form">
      <div className="contact-form__group">
        <label htmlFor="contact-name">
          Name <span aria-hidden="true">*</span>
        </label>

        <input
          id="contact-name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your full name"
          autoComplete="name"
          maxLength={100}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
        />

        {errors.name && (
          <p id="contact-name-error" className="contact-form__error" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div className="contact-form__group">
        <label htmlFor="contact-email">
          Email <span aria-hidden="true">*</span>
        </label>

        <input
          id="contact-email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your email address"
          autoComplete="email"
          maxLength={254}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
        />

        {errors.email && (
          <p id="contact-email-error" className="contact-form__error" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div className="contact-form__group">
        <div className="contact-form__label-row">
          <label htmlFor="contact-message">
            Message <span aria-hidden="true">*</span>
          </label>

          <span className="contact-form__counter">{values.message.length}/1000</span>
        </div>

        <textarea
          id="contact-message"
          name="message"
          value={values.message}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="How can we help you?"
          rows={6}
          maxLength={1000}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
        />

        {errors.message && (
          <p id="contact-message-error" className="contact-form__error" role="alert">
            {errors.message}
          </p>
        )}
      </div>

      {submissionStatus && (
        <div
          className={`contact-form__status contact-form__status--${submissionStatus.type}`}
          role={submissionStatus.type === 'error' ? 'alert' : 'status'}
        >
          {submissionStatus.message}
        </div>
      )}

      <button className="contact-form__submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : submitButtonText}
      </button>

      <p className="contact-form__required-note">
        <span aria-hidden="true">*</span> Required fields
      </p>
    </form>
  );
}

export default ContactForm;

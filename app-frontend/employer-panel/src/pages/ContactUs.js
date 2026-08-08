import ContactForm from '../components/ContactForm';
import './ContactUs.css';

const IconPhone = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11 21 3 13 3 4.9c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.3 1.1L6.6 10.8z"
      fill="currentColor"
    />
  </svg>
);

const IconMail = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M4 7l8 6 8-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconPin = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M12 2c-4 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3-7-7-7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="9" r="2.5" fill="currentColor" />
  </svg>
);

function ContactUs() {
  const handleContactSubmit = async (formData) => {
    /*
     * The backend contact endpoint has not been provided yet.
     * Replace this resolved Promise with the API request when the endpoint
     * becomes available.
     */
    return Promise.resolve(formData);
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>
          Have a question or need assistance? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="contact-content">
        <section className="contact-info" aria-labelledby="contact-info-title">
          <h2 id="contact-info-title">Contact Information</h2>

          <div className="info-item">
            <div className="contact-icon" aria-hidden="true">
              <IconPhone />
            </div>

            <div className="info-item-body">
              <h3>Phone</h3>
              <a href="tel:+61312345678">+61 3 1234 5678</a>
            </div>
          </div>

          <div className="info-item">
            <div className="contact-icon" aria-hidden="true">
              <IconMail />
            </div>

            <div className="info-item-body">
              <h3>Email</h3>
              <a href="mailto:support@secureshift.com">
                support@secureshift.com
              </a>
            </div>
          </div>

          <div className="info-item">
            <div className="contact-icon" aria-hidden="true">
              <IconPin />
            </div>

            <div className="info-item-body">
              <h3>Address</h3>
              <p>Melbourne, Victoria, Australia</p>
            </div>
          </div>

          <div className="contact-response-note">
            <h3>Response time</h3>
            <p>Our team normally responds within 1–2 business days.</p>
          </div>
        </section>

        <section
          className="contact-form-section"
          aria-labelledby="contact-form-title"
        >
          <h2 id="contact-form-title">Send Us a Message</h2>

          <ContactForm
            onSubmit={handleContactSubmit}
            submitButtonText="Send Message"
          />
        </section>
      </div>
    </div>
  );
}

export default ContactUs;
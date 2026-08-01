import "./ContactUs.css";

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
    <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

        {/* Contact Form Placeholder */}
        <div className="contact-form-section">
          <h2>Send Us a Message</h2>

          {/* FE-009 will replace this placeholder */}
          <div className="form-placeholder">
            <h3>Contact form coming soon</h3>
            <p>Contact Form Component will be added here.</p>
            <button className="contact-btn" type="button">
              Notify Me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;
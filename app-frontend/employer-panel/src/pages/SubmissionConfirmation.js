import React from "react";
import { useNavigate } from "react-router-dom";
import "./SubmissionConfirmation.css";
import logo from "./logo.png"; 

const SubmissionConfirmation = () => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate("/login"); // Route to Login Page
  };

  return (
    <div className="submission-container">
      <div className="submission-card">
        <div className="submission-left">
          <h3 className="brand-title">Secure Shift</h3>
          <h1 className="confirmation-title">Submission Confirmation</h1>
          <p>
            <strong>Your submission has been received.</strong> <br />
            Our team will review your application and the documents you
            provided.
          </p>
          <p>
            If your company meets the eligibility requirements, we’ll contact
            you via email with the next steps, including login details and
            onboarding information.
          </p>
          <p>
            Please allow 3–5 business days for the review process. <br />
            If you have any questions, feel free to contact us at <br />
            <span className="support-email">support@example.com</span>.
          </p>
          <button className="login-btn" onClick={handleLoginRedirect}>
            Back to Log In
          </button>
        </div>

        <div className="submission-right">
          <img
            src={logo} 
            alt="Secure Shift Logo"
            className="logo"
          />
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmation;

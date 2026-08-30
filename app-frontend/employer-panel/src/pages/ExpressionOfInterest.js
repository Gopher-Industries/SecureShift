import React, { useRef, useState } from 'react';
import http from '../lib/http';
import './ExpressionOfInterest.css';
import { useNotification } from '../components/NotificationContext';

// Expression of Interest form component
export default function ExpressionOfInterest() {
  const { showNotification } = useNotification();
  // Form state to hold all input values
  const [form, setForm] = useState({
    companyName: '',
    abnAcn: '',
    contactPerson: '',
    contactEmail: '',
    phone: '',
    description: '',
    confirmAccurate: false, // checkbox state
  });

  // State for uploaded file
  const [file, setFile] = useState(null);

  // Ref to access the hidden file input element
  const fileInputRef = useRef(null);

  // Handle text, email, phone, and checkbox changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Update form values (checkbox stores boolean instead of string)
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // Allowed file types and max size (10MB)
  const acceptTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  const maxBytes = 10 * 1024 * 1024;

  // Validate uploaded file
  const validateFile = (f) => {
    if (!f) return 'Please choose a file.';
    if (!acceptTypes.includes(f.type)) return 'Upload JPG, PNG, or PDF only.';
    if (f.size > maxBytes) return 'File must be 10MB or less.';
    return '';
  };

  // Handle file selection
  const onSelectFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      showNotification('error', err); // show error to user
      e.target.value = ''; // clear file input
      setFile(null);
      return;
    }
    setFile(f); // valid file
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent page refresh

    // Frontend validation
    if (
      !form.companyName ||
      !form.abnAcn ||
      !form.contactPerson ||
      !form.contactEmail ||
      !form.phone ||
      !form.description
    ) {
      showNotification('warning', 'Please fill in all fields.');
      return;
    }
    if (!file) {
      showNotification('warning', 'Please upload your document.');
      return;
    }
    if (!form.confirmAccurate) {
      showNotification('warning', 'Please confirm that the information provided is accurate.');
      return;
    }

    try {
      // Build multipart form data
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));
      formData.append('documents', file);

      // POST request to backend API
      const { data } = await http.post('/auth/eoi', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Success
      showNotification('success', 'EOI submitted successfully!');
      console.log('Server response:', data);

      // Reset form fields
      setForm({
        companyName: '',
        abnAcn: '',
        contactPerson: '',
        contactEmail: '',
        phone: '',
        description: '',
        confirmAccurate: false,
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      // Error handling
      console.error(err);
      showNotification('error', err.message || 'Error submitting EOI.');
    }
  };

  return (
    <div className="eoi-page">
      <div className="eoi-body">
        {/* LEFT PANEL - FORM */}
        <div className="eoi-form-panel">
          <h1 className="eoi-title">Expression of interest</h1>
          <p className="eoi-intro">
            Only licensed and verified security companies may apply. All EOIs will be reviewed by
            our admin team before access is granted
          </p>

          <form onSubmit={handleSubmit}>
            {/* Map through text input fields */}
            {[
              { label: 'Company Name', name: 'companyName', placeholder: 'YourCompany' },
              { label: 'ABN/ ACN', name: 'abnAcn', placeholder: 'YourABN/ACN...' },
              { label: 'Contact Person', name: 'contactPerson', placeholder: 'FirstName LastName' },
              { label: 'Contact email', name: 'contactEmail', placeholder: 'example@mail.com' },
              { label: 'Phone Number', name: 'phone', placeholder: 'Your Number...' },
            ].map((field, i) => (
              <div key={i} className="eoi-field">
                <label className="eoi-label">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                  className="eoi-input"
                />
              </div>
            ))}

            {/* Description textarea */}
            <label className="eoi-label">Brief Description of Services</label>
            <textarea
              name="description"
              placeholder="Your Description..."
              value={form.description}
              onChange={handleChange}
              rows={5}
              className="eoi-textarea"
            />

            {/* File upload instructions */}
            <p className="eoi-upload-instructions">
              Please upload a valid business license, security certification, and/or relevant
              documentation. PDF, JPG, PNG only.
            </p>

            {/* FILE UPLOAD SECTION */}
            <div className="eoi-upload-box">
              <div className="eoi-upload-heading">Select a file or drag and drop here</div>
              <div className="eoi-upload-subtext">JPG, PNG or PDF, max 10MB</div>
              {file && <div className="eoi-selected-file">Selected: {file.name}</div>}
              <br />
              {/* Trigger hidden file input */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="eoi-select-file-button"
              >
                SELECT FILE
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="eoi-hidden-file-input"
                onChange={onSelectFile}
              />
            </div>

            {/* Confirm checkbox */}
            <div className="eoi-confirm-row">
              <input
                type="checkbox"
                name="confirmAccurate"
                checked={form.confirmAccurate}
                onChange={handleChange}
                className="eoi-confirm-checkbox"
              />
              I confirm that the information provided is accurate
            </div>

            {/* Submit button */}
            <button type="submit" className="eoi-submit-button">
              Submit
            </button>

            {/* Link to login */}
            <p className="eoi-login-link-row">
              <a href="/login" className="eoi-login-link">
                Already have an account? Log In!
              </a>
            </p>
          </form>
        </div>

        {/* RIGHT PANEL - Logo/branding */}
        <div className="eoi-brand-panel">
          <img src="logo.svg" alt="Secure Shift Logo" className="eoi-brand-logo" />
        </div>
      </div>
    </div>
  );
}

import React, { useRef, useState } from "react";


export default function ExpressionOfInterest() {
  const [form, setForm] = useState({
    companyName: "",
    abnAcn: "",
    contactPerson: "",
    contactEmail: "",
    phoneNumber: "",
    description: "",
    confirmAccurate: false,
  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const acceptTypes = ["application/pdf", "image/jpeg", "image/png"];
  const maxBytes = 10 * 1024 * 1024;

  const validateFile = (f) => {
    if (!f) return "Please choose a file.";
    if (!acceptTypes.includes(f.type)) return "Upload JPG, PNG, or PDF only.";
    if (f.size > maxBytes) return "File must be 10MB or less.";
    return "";
  };

  const onSelectFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      alert(err);
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      alert(err);
      return;
    }
    setFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.companyName ||
      !form.abnAcn ||
      !form.contactPerson ||
      !form.contactEmail ||
      !form.phoneNumber ||
      !form.description
    ) {
      alert("Please fill in all fields.");
      return;
    }
    if (!file) {
      alert("Please upload your document.");
      return;
    }
    if (!form.confirmAccurate) {
      alert("Please confirm that the information provided is accurate.");
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    data.append("document", file);

    console.log("Form ready to submit:", Object.fromEntries(data.entries()));
    alert("Submitted! (Demo)");
  };

  return (
    <div className="page">
      {/* Top-right buttons */}
      <div className="top-buttons">
        <a href="/expression" className="top-btn">Expression of Interest</a>
        <a href="/login" className="top-btn">Log In</a>
      </div>

      {/* Form + Logo */}
      <div className="content">
        {/* Form */}
        <div className="form-container">
          <h3 className="brand">Secure Shift</h3>
          <h1 className="title">Expression of interest</h1>
          <p className="subtitle">
            Only licensed and verified security companies may apply. All EOIs
            will be reviewed by our admin team before access is granted.
          </p>

          <form onSubmit={handleSubmit}>
            <label>Company Name</label>
            <input type="text" name="companyName" placeholder="YourCompany..."
              value={form.companyName} onChange={handleChange} />

            <label>ABN/ ACN</label>
            <input type="text" name="abnAcn" placeholder="YourABN/ACN..."
              value={form.abnAcn} onChange={handleChange} />

            <label>Contact Person</label>
            <input type="text" name="contactPerson" placeholder="FirstName LastName"
              value={form.contactPerson} onChange={handleChange} />

            <label>Contact email</label>
            <input type="email" name="contactEmail" placeholder="example@mail.com"
              value={form.contactEmail} onChange={handleChange} />

            <label>Phone Number</label>
            <input type="tel" name="phoneNumber" placeholder="Your Number..."
              value={form.phoneNumber} onChange={handleChange} />

            <label>Brief Description of Services</label>
            <textarea name="description" placeholder="Your Description..."
              value={form.description} onChange={handleChange} rows={5} />

            <p className="file-note">
              Please upload a valid business license, security certification, and/or relevant documentation.  
              PDF format only. This will be used to verify your eligibility as a licensed security company.
            </p>

            <div className="file-drop" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
              <div>Select a file or drag and drop here</div>
              <div>JPG, PNG or PDF, file size no more than 10MB</div>
              {file && <div>Selected: {file.name}</div>}
              <br />
              <button className="file-button" type="button" onClick={() => fileInputRef.current?.click()}>
                Select File
              </button>
              <input ref={fileInputRef} type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={onSelectFile} style={{ display: "none" }} />
            </div>

            <div className="checkbox">
              <input type="checkbox" name="confirmAccurate"
                checked={form.confirmAccurate} onChange={handleChange} />
              I confirm that the information provided is accurate
            </div>

            <button type="submit" className="submit-btn">Submit</button>

            <p><a href="/login" className="login-link">Already have an account? Log In!</a></p>
          </form>
        </div>

        {/* Logo */}
        <div className="logo-container">
          <img src="secure-shift-logo.png" alt="Secure Shift Logo" />
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footer-left">
          <img src="secure-shift-logo.png" alt="logo" /> Secure Shift
        </div>
        <div className="footer-links">
          <a href="/privacy">Privacy policy</a>
          <a href="/terms">Terms and Conditions</a>
          <a href="/faqs">FAQ's</a>
          <a href="/contact">Contact Us</a>
        </div>
      </div>
    </div>
  );
}

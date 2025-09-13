import React, { useRef, useState } from "react";
import http from "../lib/http";

// Expression of Interest form component
export default function ExpressionOfInterest() {
  // Form state to hold all input values
  const [form, setForm] = useState({
    companyName: "",
    abnAcn: "",
    contactPerson: "",
    contactEmail: "",
    phone: "",
    description: "",
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
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  // Allowed file types and max size (10MB)
  const acceptTypes = ["application/pdf", "image/jpeg", "image/png"];
  const maxBytes = 10 * 1024 * 1024;

  // Validate uploaded file
  const validateFile = (f) => {
    if (!f) return "Please choose a file.";
    if (!acceptTypes.includes(f.type)) return "Upload JPG, PNG, or PDF only.";
    if (f.size > maxBytes) return "File must be 10MB or less.";
    return "";
  };

  // Handle file selection
  const onSelectFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      alert(err); // show error to user
      e.target.value = ""; // clear file input
      setFile(null);
      return;
    }
    setFile(f); // valid file
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent page refresh

    // Frontend validation
    if (!form.companyName || !form.abnAcn || !form.contactPerson || !form.contactEmail || !form.phone || !form.description) {
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

    try {
      // Build multipart form data
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));
      formData.append("documents", file);

      // POST request to backend API
      const { data } = await http.post("/auth/eoi", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Success
      alert("EOI submitted successfully!");
      console.log("Server response:", data);

      // Reset form fields
      setForm({
        companyName: "",
        abnAcn: "",
        contactPerson: "",
        contactEmail: "",
        phone: "",
        description: "",
        confirmAccurate: false,
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      // Error handling
      console.error(err);
      alert(err.message || "Error submitting EOI.");
    }
  };

  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        background: "#fafafa",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, display: "flex" }}>
        {/* LEFT PANEL - FORM */}
        <div style={{ width: "50%", background: "#fff", padding: "40px 60px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "600", marginBottom: "10px" }}>
            Expression of interest
          </h1>
          <p style={{ fontSize: "14px", color: "#1e1e1e", marginBottom: "20px" }}>
            Only licensed and verified security companies may apply. All EOIs will be
            reviewed by our admin team before access is granted
          </p>

          <form onSubmit={handleSubmit}>
            {/* Map through text input fields */}
            {[
              { label: "Company Name", name: "companyName", placeholder: "YourCompany" },
              { label: "ABN/ ACN", name: "abnAcn", placeholder: "YourABN/ACN..." },
              { label: "Contact Person", name: "contactPerson", placeholder: "FirstName LastName" },
              { label: "Contact email", name: "contactEmail", placeholder: "example@mail.com" },
              { label: "Phone Number", name: "phone", placeholder: "Your Number..." },
            ].map((field, i) => (
              <div key={i} style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "6px",
                  }}
                >
                  {field.label}
                </label>
                <input
                  type="text"
                  name={field.name}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "25px",
                    border: "1px solid #ababab",
                    background: "#ababab",
                    color: "#fff",
                  }}
                />
              </div>
            ))}

            {/* Description textarea */}
            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
              Brief Description of Services
            </label>
            <textarea
              name="description"
              placeholder="Your Description..."
              value={form.description}
              onChange={handleChange}
              rows={5}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ababab",
                background: "#ababab",
                marginBottom: "16px",
                color: "#fff",
              }}
            />

            {/* File upload instructions */}
            <p style={{ fontSize: "12px", fontWeight: "600", marginBottom: "12px" }}>
              Please upload a valid business license, security certification, and/or
              relevant documentation. PDF, JPG, PNG only.
            </p>

            {/* FILE UPLOAD SECTION */}
            <div
              style={{
                border: "2px dashed #ababab",
                padding: "20px",
                textAlign: "center",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontWeight: "600" }}>
                Select a file or drag and drop here
              </div>
              <div style={{ fontSize: "12px", color: "#6c6c6c" }}>
                JPG, PNG or PDF, max 10MB
              </div>
              {file && (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: "#274b93",
                  }}
                >
                  Selected: {file.name}
                </div>
              )}
              <br />
              {/* Trigger hidden file input */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #274b93",
                  background: "#fff",
                  color: "#274b93",
                  cursor: "pointer",
                }}
              >
                SELECT FILE
              </button>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={onSelectFile}
              />
            </div>

            {/* Confirm checkbox */}
            <div style={{ marginBottom: "20px" }}>
              <input
                type="checkbox"
                name="confirmAccurate"
                checked={form.confirmAccurate}
                onChange={handleChange}
                style={{ marginRight: "8px" }}
              />
              I confirm that the information provided is accurate
            </div>

            {/* Submit button */}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "25px",
                background: "#072261",
                color: "#fff",
                fontSize: "18px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
              }}
            >
              Submit
            </button>

            {/* Link to login */}
            <p style={{ marginTop: "10px", fontSize: "12px", textAlign: "center" }}>
              <a href="/login" style={{ color: "#aa0028", textDecoration: "none" }}>
                Already have an account? Log In!
              </a>
            </p>
          </form>
        </div>

        {/* RIGHT PANEL - Logo/branding */}
        <div
          style={{
            width: "50%",
            background: "#072261",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src="logo.svg"
            alt="Secure Shift Logo"
            style={{ width: "400px", height: "auto" }}
          />
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function EmployerRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    addressNo: '',
    street1: '',
    street2: '',
    suburb: '',
    postalCode: '',
    reason: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company Name is required';
    if (!formData.addressNo.trim()) newErrors.addressNo = 'Address number is required';
    if (!formData.street1.trim()) newErrors.street1 = 'Street 1 is required';
    if (!formData.suburb.trim()) newErrors.suburb = 'Suburb is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal Code is required';
    if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid Email is required';
    if (!formData.password || formData.password.length < 6) newErrors.password = 'Minimum 6 characters required';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    console.log('Registered:', formData);
    navigate('/dashboard');
  };

  return (
    <div>
      <h2>Secure Shift</h2>
      <p>Employer</p>
      <h1>Register</h1>
      <p>We are excited to have you!</p>

      <form onSubmit={handleSubmit}>
        {/* First Name */}
        <div>
          <label>First Name</label><br />
          <input
            type="text"
            name="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
          />
          <br />
          {errors.firstName && <span style={{ color: 'red' }}>{errors.firstName}</span>}
        </div>

        {/* Last Name */}
        <div>
          <label>Last Name</label><br />
          <input
            type="text"
            name="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
          />
          <br />
          {errors.lastName && <span style={{ color: 'red' }}>{errors.lastName}</span>}
        </div>

        {/* Company Name */}
        <div>
          <label>Company Name</label><br />
          <input
            type="text"
            name="companyName"
            placeholder="YourCompany"
            value={formData.companyName}
            onChange={handleChange}
          />
          <br />
          {errors.companyName && <span style={{ color: 'red' }}>{errors.companyName}</span>}
        </div>

        {/* Address Section */}
        <div>
          <h3>Address</h3>

          <label>No.</label><br />
          <input
            type="text"
            name="addressNo"
            placeholder="e.g. 15"
            value={formData.addressNo}
            onChange={handleChange}
          />
          <br />
          {errors.addressNo && <span style={{ color: 'red' }}>{errors.addressNo}</span>}

          <br />
          <label>Street 1</label><br />
          <input
            type="text"
            name="street1"
            placeholder="Main Street"
            value={formData.street1}
            onChange={handleChange}
          />
          <br />
          {errors.street1 && <span style={{ color: 'red' }}>{errors.street1}</span>}

          <br />
          <label>Street 2 (optional)</label><br />
          <input
            type="text"
            name="street2"
            placeholder="Apartment, Unit, etc."
            value={formData.street2}
            onChange={handleChange}
          />
          <br />

          <br />
          <label>Suburb</label><br />
          <input
            type="text"
            name="suburb"
            placeholder="Melbourne"
            value={formData.suburb}
            onChange={handleChange}
          />
          <br />
          {errors.suburb && <span style={{ color: 'red' }}>{errors.suburb}</span>}

          <br />
          <label>Postal Code</label><br />
          <input
            type="text"
            name="postalCode"
            placeholder="3000"
            value={formData.postalCode}
            onChange={handleChange}
          />
          <br />
          {errors.postalCode && <span style={{ color: 'red' }}>{errors.postalCode}</span>}
        </div>

        {/* Reason for joining */}
        <div>
          <label>Reason for Joining</label><br />
          <textarea
            name="reason"
            placeholder="Tell us why you want to join..."
            value={formData.reason}
            onChange={handleChange}
            rows={4}
            cols={40}
          />
          <br />
          {errors.reason && <span style={{ color: 'red' }}>{errors.reason}</span>}
        </div>

        {/* Email */}
        <div>
          <label>Email</label><br />
          <input
            type="email"
            name="email"
            placeholder="example@mail.com"
            value={formData.email}
            onChange={handleChange}
          />
          <br />
          {errors.email && <span style={{ color: 'red' }}>{errors.email}</span>}
        </div>

        {/* Password */}
        <div>
          <label>Password</label><br />
          <input
            type="password"
            name="password"
            placeholder="***************"
            value={formData.password}
            onChange={handleChange}
          />
          <br />
          {errors.password && <span style={{ color: 'red' }}>{errors.password}</span>}
        </div>

        {/* Confirm Password */}
        <div>
          <label>Confirm Password</label><br />
          <input
            type="password"
            name="confirmPassword"
            placeholder="***************"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <br />
          {errors.confirmPassword && <span style={{ color: 'red' }}>{errors.confirmPassword}</span>}
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: '10px' }}>
          <button type="submit">Sign Up</button>
        </div>

        <p>
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Log in!
          </span>
        </p>
      </form>
    </div>
  );
}

export default EmployerRegistration;

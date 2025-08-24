import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateShift = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: '',
    time: '',
    payRate: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validate = () => {
    const newErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) {
        newErrors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Submitted:', formData);
      alert('Shift created successfully!');
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      location: '',
      date: '',
      time: '',
      payRate: ''
    });
    setErrors({});
  };

   // Inline styles 
  const styles = {
    page: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#fafafa',
      fontFamily: 'Poppins, sans-serif',
    },
    
    content: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'stretch',
    },
    formSection: {
      flex: 1,
      padding: '50px',
      background: '#fff',
    },
    formTitle: {
      fontSize: '28px',
      fontWeight: '600',
      marginBottom: '8px',
    },
    formSubtitle: {
      fontSize: '14px',
      marginBottom: '30px',
      color: '#555',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '20px',
      border: '1px solid #ababab',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'Poppins, sans-serif',
      outline: 'none',
      backgroundColor: '#f2f2f2',
    },
    error: {
      fontSize: '13px',
      color: '#aa0028',
      margin: '-15px 0 15px',
    },
    buttonRow: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '20px',
    },
    primaryBtn: {
      padding: '12px 30px',
      background: '#274b93',
      color: '#fff',
      fontSize: '16px',
      fontWeight: '500',
      border: 'none',
      borderRadius: '25px',
      cursor: 'pointer',
      fontFamily: 'Poppins, sans-serif',
    },
    secondaryBtn: {
      padding: '12px 30px',
      background: '#fff',
      color: '#274b93',
      border: '2px solid #274b93',
      fontSize: '16px',
      fontWeight: '500',
      borderRadius: '25px',
      cursor: 'pointer',
      fontFamily: 'Poppins, sans-serif',
    },
    logoSection: {
      flex: 1,
  background: '#072261',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',  
  backgroundSize: 'contain',   // keeps aspect ratio
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
    },
    logo: {
      maxWidth: '300px',
      maxHeight: '300px',
      objectFit: 'contain',
      
    },
    footer: {
  background: '#072261',
  color: '#fff',
  padding: '15px 40px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
},
footerLeft: {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
},
footerLogo: {
  width: '26px',
  height: '26px',
},
footerLinks: {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
},
footerBtn: {
  padding: '8px 18px',
  background: '#274b93',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '500',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  fontFamily: 'Poppins, sans-serif',
},
profileIcon: {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: '#fff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
},

  };

  return (
    <div style={styles.page}>
    


      {/* Main content */}
      <div style={styles.content}>
        {/* Left - Form */}
        <div style={styles.formSection}>
          <h2 style={styles.formTitle}>Create Shift</h2>
          <p style={styles.formSubtitle}>Post a new shift and connect with reliable staff.</p>

          <form onSubmit={handleSubmit}>
            <input
              style={styles.input}
              type="text"
              name="title"
              placeholder="Job Title*"
              value={formData.title}
              onChange={handleChange}
            />
            {errors.title && <p style={styles.error}>{errors.title}</p>}

            <input
              style={styles.input}
              type="date"
              name="date"
              placeholder="Date*"
              value={formData.date}
              onChange={handleChange}
            />
            {errors.date && <p style={styles.error}>{errors.date}</p>}

            <input
              style={styles.input}
              type="time"
              name="time"
              placeholder="Time*"
              value={formData.time}
              onChange={handleChange}
            />
            {errors.time && <p style={styles.error}>{errors.time}</p>}

            <input
              style={styles.input}
              type="text"
              name="location"
              placeholder="Location*"
              value={formData.location}
              onChange={handleChange}
            />
            {errors.location && <p style={styles.error}>{errors.location}</p>}

            <input
              style={styles.input}
              type="number"
              name="payRate"
              placeholder="Pay rate*"
              value={formData.payRate}
              onChange={handleChange}
            />
            {errors.payRate && <p style={styles.error}>{errors.payRate}</p>}

            <div style={styles.buttonRow}>
              <button type="submit" style={styles.primaryBtn}>Post Shift</button>
              <button type="button" style={styles.secondaryBtn} onClick={handleReset}>Clear / Reset</button>
            </div>
          </form>
        </div>

        {/* Right - Logo */}
        <div style={styles.logoSection}>
          <img
            style={styles.logo}
            src="logo.svg"
            alt="Secure Shift Logo"
            style={{ width: '400px', height: 'auto' }}
          />
        </div>
      </div>

      {/* Footer */}
<div style={styles.footer}>
  {/* Left side: logo + Secure Shift */}
  <div style={styles.footerLeft}>
    <img src="logo.svg" alt="Logo" style={styles.footerLogo} />
    <span>Secure Shift</span>
  </div>

  {/* Right side: nav buttons + profile */}
  <div style={styles.footerLinks}>
    <button style={styles.footerBtn}>Home</button>
    <button style={styles.footerBtn}>Jobs</button>
    <button style={styles.footerBtn}>Applications</button>
    <div style={styles.profileIcon}>
      <img src="profile.png" alt="Profile" style={{ 
      width: '100%', 
      height: '100%', 
      borderRadius: '50%', 
      objectFit: 'cover' 
    }}  />
    </div>
  </div>
</div>
    </div>
    );
};

export default CreateShift;

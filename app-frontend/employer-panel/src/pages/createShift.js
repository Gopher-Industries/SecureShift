import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../lib/http';

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

  // Connect to backend with Authorization and auto-generate endTime
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // Calculate endTime as +8 hours of startTime
      const start = formData.time;
      let endTime = start;
      if (start) {
        const [hour, minute] = start.split(':').map(Number);
        const endHour = (hour + 8) % 24;
        endTime = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      }

      const payload = {
        title: formData.title,
        date: formData.date,
        startTime: formData.time,
        endTime, // backend requires this
        location: { street: formData.location },
        payRate: formData.payRate
      };

      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in as an employer.');
        return;
      }

      const { data } = await http.post('/shifts', payload);

      alert('Shift created successfully!');
      console.log('Server response:', data);
      handleReset();

    } catch (err) {
      console.error(err);
      alert(err.message || 'Error creating shift');
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

  // Inline styles unchanged
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
    formTitle: { fontSize: '28px', fontWeight: '600', marginBottom: '8px' },
    formSubtitle: { fontSize: '14px', marginBottom: '30px', color: '#555' },
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
    error: { fontSize: '13px', color: '#aa0028', margin: '-15px 0 15px' },
    buttonRow: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' },
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
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    },
    logo: { maxWidth: '300px', maxHeight: '300px', objectFit: 'contain' },
    footer: {
      background: '#072261',
      color: '#fff',
      padding: '15px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    footerLogo: { width: '26px', height: '26px' },
    footerLinks: { display: 'flex', alignItems: 'center', gap: '15px' },
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
      <div style={styles.content}>
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
        <div style={styles.logoSection}>
          <img style={styles.logo} src="logo.svg" alt="Secure Shift Logo" style={{ width: '400px', height: 'auto' }} />
        </div>
      </div>
    </div>
  );
};

export default CreateShift;

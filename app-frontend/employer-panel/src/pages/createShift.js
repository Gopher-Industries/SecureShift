import React, { useState } from 'react';

const CreateShift = () => {
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
      // Here you can add the API call logic later
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Create Shift</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
        />
        {errors.title && <p style={{ color: 'red' }}>{errors.title}</p>}

        <input
          type="text"
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
        />
        {errors.location && <p style={{ color: 'red' }}>{errors.location}</p>}

        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
        />
        {errors.date && <p style={{ color: 'red' }}>{errors.date}</p>}

        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
        />
        {errors.time && <p style={{ color: 'red' }}>{errors.time}</p>}

        <input
          type="number"
          name="payRate"
          placeholder="Pay Rate"
          value={formData.payRate}
          onChange={handleChange}
        />
        {errors.payRate && <p style={{ color: 'red' }}>{errors.payRate}</p>}

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default CreateShift;

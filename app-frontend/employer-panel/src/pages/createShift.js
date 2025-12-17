import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './createShift.css';
import http from '../lib/http';

const CreateShift = ({ isModal = false, onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    payRate: '',
    description: '',
    requirements: '',
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.date.trim()) newErrors.date = 'Date is required';
    if (!formData.time.trim()) newErrors.time = 'Time is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.payRate || Number(formData.payRate) <= 0) newErrors.payRate = 'Enter a valid pay rate';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
      payRate: '',
      description: '',
      requirements: '',
    });
    setErrors({});
    setFeedback('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setFeedback('');
    try {
      const [hour, minute] = formData.time.split(':').map(Number);
      const endHour = (hour + 8) % 24;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      const payload = {
        title: formData.title,
        date: formData.date,
        startTime: formData.time,
        endTime,
        location: { street: formData.location },
        payRate: Number(formData.payRate),
        description: formData.description,
        requirements: formData.requirements,
      };

      await http.post('/shifts', payload);
      setFeedback('Shift created successfully');
      handleReset();
    } catch (err) {
      const message = err?.response?.data?.message || 'Error creating shift';
      setFeedback(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-shift-modal-backdrop">
      <div className="create-shift-modal">
        <div className="create-shift-card">
          <header className="create-shift-header">
            <div>
              <p className="overline">Secure Shift</p>
              <h1>Create Shift</h1>
              <p className="subtitle">Post a new shift and connect with reliable staff. All fields are mandatory.</p>
            </div>
            <button className="close-btn" onClick={() => (onClose ? onClose() : navigate(-1))}>×</button>
          </header>

          <form className="create-shift-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full">
                <label>Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Job title"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={errors.date ? 'error' : ''}
                />
                {errors.date && <span className="error-text">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={errors.time ? 'error' : ''}
                />
                {errors.time && <span className="error-text">{errors.time}</span>}
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Location"
                  className={errors.location ? 'error' : ''}
                />
                {errors.location && <span className="error-text">{errors.location}</span>}
              </div>

              <div className="form-group">
                <label>Pay rate</label>
                <input
                  type="number"
                  name="payRate"
                  value={formData.payRate}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={errors.payRate ? 'error' : ''}
                />
                {errors.payRate && <span className="error-text">{errors.payRate}</span>}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter description"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Requirements</label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="Enter requirements"
                  rows={4}
                />
              </div>
            </div>

            {feedback && <div className="feedback">{feedback}</div>}

            <div className="actions">
              <button type="submit" className="primary" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Shift'}
              </button>
              <button type="button" className="secondary" onClick={handleReset}>
                Clear / Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateShift;

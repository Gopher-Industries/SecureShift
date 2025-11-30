// --- CreateShift.js ---
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../lib/http';

const CreateShift = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    street: "",
    suburb: "",
    state: "",
    postcode: "",
    date: "",
    time: "",
    payRate: ""
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validate = () => {
    const required = ["title", "street", "date", "time", "payRate"];
    const newErrors = {};

    required.forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = `${field} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Auto-generate endTime = start + 8h
    const [hour, minute] = formData.time.split(":").map(Number);
    const endHour = (hour + 8) % 24;
    const endTime = `${String(endHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    const payload = {
      title: formData.title,
      date: formData.date,
      startTime: formData.time,
      endTime,
      location: {
        street: formData.street,
        suburb: formData.suburb || "",
        state: formData.state || "",
        postcode: formData.postcode || ""
      },
      payRate: formData.payRate,
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Please log in first.");

      await http.post("/shifts", payload);

      alert("Shift created successfully!");

      // Now navigate is used → no warnings
      navigate("/manage-shifts");

    } catch (err) {
      console.error(err);
      alert("Error creating shift");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Create Shift</h2>

      <form onSubmit={handleSubmit}>

        <input name="title" placeholder="Job title*" onChange={handleChange} value={formData.title} />
        {errors.title && <p style={{ color: "red" }}>{errors.title}</p>}

        <input name="date" type="date" onChange={handleChange} value={formData.date} />
        {errors.date && <p style={{ color: "red" }}>{errors.date}</p>}

        <input name="time" type="time" onChange={handleChange} value={formData.time} />
        {errors.time && <p style={{ color: "red" }}>{errors.time}</p>}

        <input name="street" placeholder="Street*" onChange={handleChange} value={formData.street} />
        {errors.street && <p style={{ color: "red" }}>{errors.street}</p>}

        <input name="suburb" placeholder="Suburb" onChange={handleChange} value={formData.suburb} />
        <input name="state" placeholder="State" onChange={handleChange} value={formData.state} />
        <input name="postcode" placeholder="Postcode" onChange={handleChange} value={formData.postcode} />

        <input name="payRate" type="number" placeholder="Pay rate*" onChange={handleChange} value={formData.payRate} />
        {errors.payRate && <p style={{ color: "red" }}>{errors.payRate}</p>}

        <button type="submit">Create Shift</button>
      </form>
    </div>
  );
};

export default CreateShift;

// --- ManageShift.js ---
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ManageShift = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/v1/shifts", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        const shiftList = Array.isArray(data) ? data : data.shifts || [];

        const formatted = shiftList.map((s) => ({
          id: s._id,
          title: s.title,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status,
          location: formatLocation(s.location)
        }));

        setShifts(formatted);

      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchShifts();
  }, []);

  const formatLocation = (loc) => {
    if (!loc) return "No location provided";

    return [
      loc.street,
      loc.suburb,
      loc.state,
      loc.postcode
    ].filter(Boolean).join(", ");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Manage Shifts</h1>

      {/* navigate is used here → no warnings */}
      <button onClick={() => navigate("/create-shift")}>
        + Add Shift
      </button>

      <div style={{ marginTop: "20px" }}>
        {shifts.map((s) => (
          <div key={s.id} style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "10px" }}>
            <h3>{s.title}</h3>
            <p><strong>Date:</strong> {s.date}</p>
            <p><strong>Time:</strong> {s.startTime} - {s.endTime}</p>
            <p><strong>Location:</strong> {s.location}</p>
            <p><strong>Status:</strong> {s.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageShift;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployerDashboard.css";
import http from "../lib/http";

/* ---------------- ICONS ---------------- */
const IconCalendar = () => (
  <svg viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    <line x1="12" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
    <line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" />
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" />
  </svg>
);

/* ---------------- DASHBOARD ---------------- */
export default function EmployerDashboard() {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);

  /* ---------------- HELPERS ---------------- */
  const formatTime = (start, end) =>
    start && end ? `${start} - ${end}` : "N/A";

  /* ---------------- FETCH SHIFTS ---------------- */
  async function fetchShifts() {
    try {
      const { data } = await http.get("/shifts");
      const list = data.items || [];

      setShifts(
        list.map((s) => ({
          id: s._id,
          title: s.title,
          venue: s.location?.street || s.location?.suburb || "Unknown",
          rate: s.payRate || 0,
          date: new Date(s.date).toLocaleDateString(),
          time: formatTime(s.startTime, s.endTime),
          status: (s.status || "open").toLowerCase(),
          applicantCount: s.applicantCount || 0,
        }))
      );
    } catch (err) {
      console.error("❌ ERROR FETCHING SHIFTS:", err);
    }
  }

  useEffect(() => {
    fetchShifts();
    const interval = setInterval(fetchShifts, 8000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------- STATUS COUNTS (LIVE) ---------------- */
  const openCount = shifts.filter((s) => s.status === "open").length;
  const appliedCount = shifts.filter((s) => s.status === "applied").length;
  const assignedCount = shifts.filter((s) => s.status === "assigned").length;
  const completedCount = shifts.filter((s) => s.status === "completed").length;

  /* ---------------- ANALYTICS ---------------- */
  const totalShifts = shifts.length;
  const filledShifts = shifts.filter(
    (s) => s.status === "assigned" || s.status === "completed"
  );
  const fillRate =
    totalShifts === 0
      ? 0
      : Math.round((filledShifts.length / totalShifts) * 100);

  const timelineSteps = ["open", "applied", "assigned", "completed"];

  /* ---------------- RENDER ---------------- */
  return (
    <main className="ss-main">
      <h2 className="ss-h1">Overview</h2>

      {/* ---------------- STATUS SUMMARY ---------------- */}
      <div className="status-row">
        <div className="status-card open">Open Shifts: {openCount}</div>
        <div className="status-card applied">Applied Shifts: {appliedCount}</div>
        <div className="status-card assigned">Assigned Shifts: {assignedCount}</div>
        <div className="status-card completed">Completed Shifts: {completedCount}</div>
      </div>

      {/* ---------------- ANALYTICS ---------------- */}
      <div className="analytics-row">
        <div className="analytics-card">
          <div className="analytics-label">Fill Rate</div>
          <div className="analytics-value">{fillRate}%</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-label">Avg Time-to-Hire</div>
          <div className="analytics-value">--</div>
        </div>
      </div>

      {/* ---------------- CONTROLS ---------------- */}
      <div className="ss-controls">
        <button className="ss-primary" onClick={() => navigate("/create-shift")}>
          <IconPlus /> Create Shift
        </button>
      </div>

      {/* ---------------- SHIFT LIST ---------------- */}
      <div className="ss-panel">
        <div className="ss-shifts ss-shifts--list">
          {shifts.map((s) => (
            <div className="ss-row" key={s.id}>
              <div className="ss-cell ss-role">{s.title}</div>
              <div className="ss-cell ss-company">{s.venue}</div>
              <div className="ss-cell ss-rate">${s.rate} p/h</div>

              <div className="ss-cell ss-date">
                <IconCalendar /> {s.date}
              </div>

              <div className="ss-cell ss-time">
                <IconClock /> {s.time}
              </div>

              <div className={`status-badge badge-${s.status}`}>
                {s.status}
              </div>

              {/* ---------------- HOVER CARD ---------------- */}
              <div className="shift-hover-card">
              <div className="hover-meta">{s.venue}</div>

              <div className="hover-status">
              {timelineSteps.map((step) => (
              <span
              key={step}
              className={s.status === step ? "active" : ""}
            >
            {step}
                </span>
           ))}
            </div>

              <button
                className="hover-btn"
                onClick={() => navigate(`/shift/${s.id}/applicants`)}
              >
                View Applicants ({s.applicantCount})
              </button>
            </div>

            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

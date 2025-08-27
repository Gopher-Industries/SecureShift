import React from "react";
import { useNavigate } from "react-router-dom";

export default function EmployerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Employer Dashboard</h1>
        <p>Welcome to SecureShift</p>
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Create Shift</h2>
          <p>Post a new shift for available guards to apply.</p>
          <button onClick={() => navigate("/create-shift")}>Create</button>
        </div>

        <div className="dashboard-card">
          <h2>Manage Shifts</h2>
          <p>View and update upcoming and past shifts.</p>
          <button onClick={() => navigate("/manage-shift")}>Manage</button>
        </div>

        <div className="dashboard-card">
          <h2>Guard Profiles</h2>
          <p>Browse and shortlist guards based on experience.</p>
          <button onClick={() => navigate("/guard-profiles")}>View</button>
        </div>
        <div className="dashboard-card">
          <h2>Company Profiles</h2>
          <p>Browse and manage company profiles.</p>
          <button onClick={() => navigate("/company-profile")}>View</button>
        </div>
      </div>
    </div>
  );
}

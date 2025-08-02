import React from "react";

export default function EmployerDashboard() {
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
          <button>Create</button>
        </div>

        <div className="dashboard-card">
          <h2>Manage Shifts</h2>
          <p>View and update upcoming and past shifts.</p>
          <button>Manage</button>
        </div>

        <div className="dashboard-card">
          <h2>Guard Profiles</h2>
          <p>Browse and shortlist guards based on experience.</p>
          <button>View</button>
        </div>

        <div className="dashboard-card">
          <h2>Messages</h2>
          <p>Send or review messages to/from security guards.</p>
          <button>Open</button>
        </div>
      </div>
    </div>
  );
}
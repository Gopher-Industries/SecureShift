import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Timesheet.css';

const summaryCards = [
  { title: 'Active Now', value: 10, className: 'active-card' },
  { title: 'Late Arrivals', value: 3, className: 'late-card' },
  { title: 'Absent', value: 4, className: 'absent-card' },
  { title: 'Completed', value: 20, className: 'completed-card' },
];

const mockTimesheets = [
  {
    guard: 'John Doe',
    shiftDate: '2026-17-03',
    location: 'Chadstone Shopping Center',
    clockIn: '08:00:00',
    clockOut: '--',
    totalHours: '--',
    payRate: '$45/hr',
    status: 'Active',
    totalPayment: '--',
  },
  {
    guard: 'John Doe',
    shiftDate: '2026-17-03',
    location: 'Chadstone Shopping Center',
    clockIn: '--',
    clockOut: '--',
    totalHours: '--',
    payRate: '$45/hr',
    status: 'Absent',
    totalPayment: '--',
  },
  {
    guard: 'John Doe',
    shiftDate: '2026-17-03',
    location: 'Chadstone Shopping Center',
    clockIn: '08:00:00',
    clockOut: '--',
    totalHours: '--',
    payRate: '$45/hr',
    status: 'Late',
    totalPayment: '--',
  },
  {
    guard: 'John Doe',
    shiftDate: '2026-17-03',
    location: 'Chadstone Shopping Center',
    clockIn: '08:00:00',
    clockOut: '10:00:00',
    totalHours: '2h 00m',
    payRate: '$45/hr',
    status: 'Completed',
    totalPayment: '$90.00',
  },
  {
    guard: 'John Doe',
    shiftDate: '2026-17-03',
    location: 'Chadstone Shopping Center',
    clockIn: '08:00:00',
    clockOut: '--',
    totalHours: '--',
    payRate: '$45/hr',
    status: 'Active',
    totalPayment: '--',
  },
  {
    guard: 'John Doe',
    shiftDate: '2026-17-03',
    location: 'Chadstone Shopping Center',
    clockIn: '08:00:00',
    clockOut: '--',
    totalHours: '--',
    payRate: '$45/hr',
    status: 'Active',
    totalPayment: '--',
  },
];

export default function Timesheet() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTimesheets = mockTimesheets.filter((item) => {
    const matchesFilter = selectedFilter === 'All' || item.status === selectedFilter;

    const matchesSearch = item.guard.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="timesheet-page">
      <div className="timesheet-container">
        <h1 className="timesheet-title">Timesheets</h1>

        <div className="summary-cards">
          {summaryCards.map((card, index) => (
            <div key={index} className={`summary-card ${card.className}`}>
              <div className="summary-title">{card.title}</div>
              <div className="summary-value">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="timesheet-toolbar">
          <input
            type="text"
            placeholder="Search guard name..."
            className="timesheet-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select className="timesheet-select">
            <option>All Sites</option>
            <option>Chadstone Shopping Center</option>
          </select>

          <div className="timesheet-filters">
            {['All', 'Active', 'Completed', 'Late', 'Absent'].map((filter) => (
              <button
                key={filter}
                className={`filter-btn ${selectedFilter === filter ? 'active-filter' : ''}`}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="timesheet-sort">Sort by: Date (DESC)</div>
        </div>

        <div className="timesheet-table-wrapper">
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Guard</th>
                <th>Shift Date</th>
                <th>Location</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Total Hours</th>
                <th>Pay Rate</th>
                <th>Status</th>
                <th>Total Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredTimesheets.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="guard-cell">
                      <div className="guard-avatar"></div>
                      <span>{item.guard}</span>
                    </div>
                  </td>
                  <td>{item.shiftDate}</td>
                  <td>{item.location}</td>
                  <td>{item.clockIn}</td>
                  <td>{item.clockOut}</td>
                  <td>{item.totalHours}</td>
                  <td>{item.payRate}</td>
                  <td>
                    <span className={`status-badge ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.totalPayment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="timesheet-footer">
          <div className="pagination">‹ 1 2 3 4 10 ›</div>
          <button className="back-dashboard-btn" onClick={() => navigate('/employer-dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

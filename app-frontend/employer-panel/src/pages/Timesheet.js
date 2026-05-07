import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../lib/http";
import "./Timesheet.css";

const LATE_GRACE_MINUTES = 5;
const PAGE_SIZE = 10;
const STATUS_FILTERS = ["All", "Active", "Completed", "Late", "Absent"];
const Sort = Object.freeze({ DateDesc: "Date (Desc)", DateAsc: "Date (Asc)" });

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDate(d) {
  if (!d) return "--";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(d) {
  if (!d) return "--";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "--";
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function formatHoursWorked(hours) {
  if (!hours || hours <= 0) return "--";
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return `${whole}h ${pad2(minutes)}m`;
}

function formatLocation(loc, fallback) {
  if (!loc) return fallback || "--";
  const parts = [loc.suburb, loc.state].filter(Boolean);
  return parts.length ? parts.join(", ") : fallback || "--";
}

function deriveUiStatus(record) {
  if (!record) return "Scheduled";
  if (record.status === "absent") return "Absent";
  if (record.status === "present") return "Completed";
  if (record.status === "incomplete") {
    if (record.clockIn && record.scheduledStart) {
      const lateBy =
        new Date(record.clockIn).getTime() -
        new Date(record.scheduledStart).getTime();
      if (lateBy > LATE_GRACE_MINUTES * 60 * 1000) return "Late";
    }
    return "Active";
  }
  return "Scheduled";
}

function buildRows(shifts, attendanceLists) {
  return shifts.map((shift, i) => {
    const guardId = shift.acceptedBy?._id;
    const records = attendanceLists[i]?.records || [];
    const record =
      records.find((r) => r.guard?._id === guardId) || records[0] || null;

    const uiStatus = deriveUiStatus(record);
    const payRate = typeof shift.payRate === "number" ? shift.payRate : 0;
    const hoursWorked = record?.hoursWorked || 0;
    const totalPayment =
      record?.clockOut && hoursWorked > 0
        ? `$${(hoursWorked * payRate).toFixed(2)}`
        : "--";

    return {
      id: shift._id,
      guard: shift.acceptedBy?.name || "--",
      sortDate: new Date(shift.date).getTime() || 0,
      shiftDate: formatDate(shift.date),
      location: formatLocation(shift.location, shift.title),
      clockIn: record ? formatTime(record.clockIn) : "--",
      clockOut: record ? formatTime(record.clockOut) : "--",
      totalHours: formatHoursWorked(hoursWorked),
      payRate: payRate ? `$${payRate}/hr` : "--",
      status: uiStatus,
      totalPayment,
    };
  });
}

export default function Timesheet() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSite, setSelectedSite] = useState("All Sites");
  const [sortBy, setSortBy] = useState(Sort.DateDesc);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await http.get("/shifts/myshifts");
        const list = Array.isArray(data) ? data : [];
        const assignedShifts = list.filter((s) => s.acceptedBy);
        const attendanceLists = await Promise.all(
          assignedShifts.map((s) =>
            http
              .get(`/payroll/attendance/${s._id}`)
              .then((r) => r.data)
              .catch(() => ({ records: [] }))
          )
        );
        if (cancelled) return;
        setRows(buildRows(assignedShifts, attendanceLists));
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to load timesheets"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const summary = useMemo(() => {
    const counts = { Active: 0, Late: 0, Absent: 0, Completed: 0 };
    rows.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    return [
      { title: "Active Now", value: counts.Active, className: "active-card" },
      { title: "Late Arrivals", value: counts.Late, className: "late-card" },
      { title: "Absent", value: counts.Absent, className: "absent-card" },
      { title: "Completed", value: counts.Completed, className: "completed-card" },
    ];
  }, [rows]);

  const siteOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.location).filter(Boolean));
    return ["All Sites", ...Array.from(set).sort()];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rows
      .filter((r) => {
        const matchesStatus =
          selectedFilter === "All" || r.status === selectedFilter;
        const matchesSite =
          selectedSite === "All Sites" || r.location === selectedSite;
        const matchesSearch =
          !q ||
          r.guard.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q);
        return matchesStatus && matchesSite && matchesSearch;
      })
      .sort((a, b) =>
        sortBy === Sort.DateDesc ? b.sortDate - a.sortDate : a.sortDate - b.sortDate
      );
  }, [rows, selectedFilter, selectedSite, searchTerm, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [selectedFilter, selectedSite, searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="timesheet-page">
      <div className="timesheet-container">
        <h1 className="timesheet-title">Timesheets</h1>

        <div className="summary-cards">
          {summary.map((card) => (
            <div key={card.title} className={`summary-card ${card.className}`}>
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

          <select
            className="timesheet-select"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
          >
            {siteOptions.map((site) => (
              <option key={site} value={site}>{site}</option>
            ))}
          </select>

          <div className="timesheet-filters">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                className={`filter-btn ${selectedFilter === filter ? "active-filter" : ""}`}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div style={sortGroupStyle}>
            <img src="/ic-sort.svg" alt="Sort" style={{ width: 20, height: 20 }} />
            <span style={labelStyle}>Sort by:</span>
            <select
              style={sortSelectStyle}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {Object.values(Sort).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div style={{ color: "red", padding: "0.5rem 0" }}>{error}</div>
        )}

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
              {loading ? (
                <tr><td colSpan={9}>Loading timesheets…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={9}>No timesheet entries yet.</td></tr>
              ) : (
                pageRows.map((item) => (
                  <tr key={item.id}>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="timesheet-footer">
          <div className="pagination">
            <button
              type="button"
              className="pagination-nav"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              ‹
            </button>
            {" "}Page {safePage} of {totalPages}{" "}
            <button
              type="button"
              className="pagination-nav"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              ›
            </button>
          </div>
          <button
            className="back-dashboard-btn"
            onClick={() => navigate("/employer-dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: "14px", fontWeight: "400", color: "#1E1E1E" };

const sortGroupStyle = { display: "flex", alignItems: "center", gap: "12px" };

const sortSelectStyle = {
  backgroundColor: "white",
  border: "1px solid #e0e0e0",
  borderRadius: "12px",
  padding: "8px 16px",
  fontSize: "14px",
  color: "#666",
  cursor: "pointer",
};


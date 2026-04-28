import React, { useState, useEffect } from "react";
import "./Payroll.css";
import http from "../lib/http";

const MONTHS = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
];

const GUARDS_PER_PAGE = 3;

function initials(name) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

function formatCurrency(amount) {
  return "$" + (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// converts an ISO date string to DD-MM-YYYY for display
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, "-");
}

// builds the first and last day of a given month as ISO date strings
function getMonthRange(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export default function Payroll() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "SecureShift - Payroll";

    const fetchPayroll = async () => {
      setLoading(true);
      setError("");
      try {
        const { startDate, endDate } = getMonthRange(selectedYear, selectedMonth);
        const res = await http.get("/payroll", {
          params: { startDate, endDate, periodType: "monthly" },
        });
        setRecords(res.data.records || []);
      } catch (err) {
        console.error("Failed to load payroll:", err);
        setError("Failed to load payroll data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [selectedMonth, selectedYear]);

  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // filter by search term against guard name
  const filtered = records.filter((r) =>
    (r.guardName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / GUARDS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * GUARDS_PER_PAGE,
    currentPage * GUARDS_PER_PAGE
  );

  // collapses middle pages into ellipsis when there are many
  const getPageNumbers = () => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="payroll-page">
      <div className="payroll-container">

        {/* Page header - title + month picker */}
        <div className="payroll-header-row">
          <h1 className="payroll-title">Payroll</h1>
          <div className="payroll-period">
            <span className="payroll-period-label">Pay Period</span>
            <select
              className="payroll-month-select"
              value={selectedMonth}
              onChange={handleMonthChange}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="payroll-toolbar">
          <input
            type="text"
            placeholder="Search guard name..."
            className="payroll-search"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {loading && <div className="payroll-status">Loading payroll...</div>}
        {error && <div className="payroll-status payroll-status--error">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="payroll-empty">
            No completed shifts found for {MONTHS[selectedMonth]}.
          </div>
        )}

        {!loading && !error && paginated.length > 0 && (
          <div className="payroll-table-wrapper">
            <table className="payroll-table">
              <colgroup>
                <col style={{ width: "28%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "22%" }} />
              </colgroup>

              {paginated.map((record) => {
                // only show entries where the guard actually worked
                const entries = (record.entries || []).filter(
                  (e) => e.attendanceStatus === "present" || e.actualHours > 0
                );
                if (entries.length === 0) return null;

                return (
                  <React.Fragment key={record._id}>
                    <thead className="payroll-guard-thead">
                      <tr>
                        <th>Guard</th>
                        <th>Shift Date</th>
                        <th>Hours</th>
                        <th>Pay Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, idx) => (
                        <tr key={idx} className="payroll-shift-row">
                          <td>
                            <div className="guard-cell">
                              <div className="guard-avatar">{initials(record.guardName || "?")}</div>
                              <span>{record.guardName}</span>
                            </div>
                          </td>
                          <td>{formatDate(entry.shiftDate)}</td>
                          <td>{entry.actualHours ?? entry.scheduledHours}</td>
                          <td>${entry.payRate}/hr</td>
                          <td>{formatCurrency(entry.totalPay)}</td>
                        </tr>
                      ))}
                      <tr className="payroll-total-row">
                        <td colSpan={4} className="payroll-total-label">TOTAL</td>
                        <td className="payroll-total-amount">{formatCurrency(record.grossPay)}</td>
                      </tr>
                      {/* visual gap between guard blocks */}
                      <tr className="payroll-spacer"><td colSpan={5}></td></tr>
                    </tbody>
                  </React.Fragment>
                );
              })}
            </table>
          </div>
        )}

        <div className="pagination" style={{ marginTop: "24px", justifyContent: "center" }}>
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {getPageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={i} className="page-ellipsis">…</span>
            ) : (
              <button
                key={i}
                className={`page-btn ${p === currentPage ? "active-page" : ""}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>

      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import "./Payroll.css";
import http from "../lib/http";
import translations from "../i18n/translations";
import RefreshButton from "../components/RefreshButton";
import { generatePayrollPDF } from "../utils/generatePayrollPdf";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" })
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

export default function Payroll({ language }) {
  const t = translations[language || "en"] || translations.en;
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // PDF generation state
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const fetchPayroll = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
      setRecords([]);
    }
    setError("");
    try {
      const { startDate, endDate } = getMonthRange(selectedYear, selectedMonth);
      const res = await http.get("/payroll", {
        params: { startDate, endDate, periodType: "monthly" },
      });
      
      const responseData = res.data;
      const list = Array.isArray(responseData)
        ? responseData
        : (responseData.records || responseData.payroll || responseData.data || []);

      setRecords(list);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load payroll:", err);
      setError("Failed to load payroll data. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [selectedMonth, selectedYear]);

  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
    setCurrentPage(1);
    setPdfError("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDownloadPDF = () => {
    setPdfDownloading(true);
    setPdfError("");

    try {
      generatePayrollPDF(records, MONTHS[selectedMonth], selectedYear);
    } catch (err) {
      setPdfError(err.message || "Failed to generate PDF report.");
    } finally {
      setPdfDownloading(false);
    }
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

        {/* Page header - title + month picker + PDF action */}
        <div className="payroll-header-row">
          <h1 className="payroll-title">{t.payroll}</h1>
          <div className="payroll-period" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfDownloading || loading}
              className="payroll-pdf-btn"
              style={{
                padding: "8px 16px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: pdfDownloading ? "not-allowed" : "pointer",
                opacity: pdfDownloading || loading ? 0.6 : 1,
              }}
            >
              {pdfDownloading ? "Generating PDF..." : "Download Payroll PDF"}
            </button>
            <RefreshButton
              onRefresh={() => fetchPayroll(true)}
              isRefreshing={isRefreshing}
              lastRefreshed={lastRefreshed}
            />
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

        {pdfError && <div className="payroll-status payroll-status--error">{pdfError}</div>}
        {loading && <div className="payroll-status">Loading payroll...</div>}
        {error && <div className="payroll-status payroll-status--error">{error}</div>}

        {/* Single table so the colgroup keeps columns aligned across all guard blocks */}
        {!loading && !error && filtered.length === 0 && (
          <div className="payroll-empty">
            No completed shifts found for {MONTHS[selectedMonth]}.
          </div>
        )}

        {!loading && !error && paginated.length > 0 && (
          <div className="payroll-table-wrapper">
            <table className="payroll-table">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "17%" }} />
              </colgroup>

              {paginated.map((record) => {
                const entries = (record.entries || []).filter(
                  (e) => e.attendanceStatus === "present" || e.actualHours > 0 || e.scheduledHours > 0 || true
                );
                if (entries.length === 0) return null;

                return (
                  <React.Fragment key={record._id || Math.random()}>
                    <thead className="payroll-guard-thead">
                      <tr>
                        <th>Guard</th>
                        <th>Shift Date</th>
                        <th>Location</th>
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
                          <td>{formatDate(entry.shiftDate || entry.date)}</td>
                          <td>{entry.location || "—"}</td>
                          <td>{entry.actualHours ?? entry.scheduledHours ?? 0}</td>
                          <td>${entry.payRate || record.hourlyRate || 0}/hr</td>
                          <td>{formatCurrency(entry.totalPay || entry.totalAmount)}</td>
                        </tr>
                      ))}
                      <tr className="payroll-total-row">
                        <td colSpan={5} className="payroll-total-label">TOTAL</td>
                        <td className="payroll-total-amount">{formatCurrency(record.grossPay || record.totalPay)}</td>
                      </tr>
                      {/* visual gap between guard blocks */}
                      <tr className="payroll-spacer"><td colSpan={6}></td></tr>
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
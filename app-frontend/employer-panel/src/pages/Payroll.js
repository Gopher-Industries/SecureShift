import React, { useState, useEffect } from "react";
import "./Payroll.css";
import http from "../lib/http";
import translations from "../i18n/translations";
import RefreshButton from "../components/RefreshButton";
import { generatePayrollPDF } from "./Payrollpdf";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const GUARDS_PER_PAGE = 3;

const USE_SAMPLE_DATA_ON_ERROR = true;

const SAMPLE_PAYROLL_RECORDS = [
  {
    _id: "sample-1",
    guardName: "Daniel Okafor",
    grossPay: 1284.5,
    entries: [
      { shiftDate: "2026-09-02", location: "Southbank Tower", attendanceStatus: "present", actualHours: 8, payRate: 34.5, totalPay: 276 },
      { shiftDate: "2026-09-05", location: "Southbank Tower", attendanceStatus: "present", actualHours: 8, payRate: 34.5, totalPay: 276 },
      { shiftDate: "2026-09-09", location: "Docklands Precinct", attendanceStatus: "present", actualHours: 10, payRate: 34.5, totalPay: 345 },
      { shiftDate: "2026-09-14", location: "Docklands Precinct", attendanceStatus: "present", actualHours: 8.5, payRate: 34.5, totalPay: 293.25 },
      { shiftDate: "2026-09-18", location: "Southbank Tower", attendanceStatus: "absent", actualHours: 0, payRate: 34.5, totalPay: 0 },
    ],
  },
  {
    _id: "sample-2",
    guardName: "Priya Nathan",
    grossPay: 962.4,
    entries: [
      { shiftDate: "2026-09-03", location: "Chadstone Retail", attendanceStatus: "present", actualHours: 6, payRate: 32, totalPay: 192 },
      { shiftDate: "2026-09-04", location: "Chadstone Retail", attendanceStatus: "present", actualHours: 6, payRate: 32, totalPay: 192 },
      { shiftDate: "2026-09-11", location: "Chadstone Retail", actualHours: 12.2, payRate: 32, totalPay: 390.4 },
      { shiftDate: "2026-09-20", location: "Crown Events", actualHours: 6, payRate: 31.5, totalPay: 189 },
    ],
  },
  {
    _id: "sample-3",
    guardName: "Marcus Webb",
    grossPay: 0,
    entries: [
      { shiftDate: "2026-09-06", location: "Melbourne Central", attendanceStatus: "absent", actualHours: 0, payRate: 33, totalPay: 0 },
      { shiftDate: "2026-09-13", location: "Melbourne Central", attendanceStatus: "sick", actualHours: 0, payRate: 33, totalPay: 0 },
    ],
  },
  {
    _id: "sample-4",
    guardName: "Aisha Bello",
    grossPay: 2156.8,
    entries: [
      { shiftDate: "2026-09-01", location: "Airport West Depot", attendanceStatus: "present", actualHours: 12, payRate: 38, totalPay: 456 },
      { shiftDate: "2026-09-02", location: "Airport West Depot", attendanceStatus: "present", actualHours: 12, payRate: 38, totalPay: 456 },
      { shiftDate: "2026-09-08", location: "Airport West Depot", attendanceStatus: "present", actualHours: 12, payRate: 38, totalPay: 456 },
      { shiftDate: "2026-09-15", location: "Tullamarine Cargo", attendanceStatus: "present", actualHours: 10, payRate: 38, totalPay: 380 },
      { shiftDate: "2026-09-22", location: "Tullamarine Cargo", attendanceStatus: "present", actualHours: 11, payRate: 38, totalPay: 408.8 },
    ],
  },
];


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

export default function Payroll({ language, companyName }) {
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

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState(null); 

  const fetchPayroll = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
      setRecords([]);
    }
    setError("");

    if (USE_SAMPLE_DATA_ON_ERROR) {
      setRecords(SAMPLE_PAYROLL_RECORDS);
      setLastRefreshed(new Date());
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const { startDate, endDate } = getMonthRange(selectedYear, selectedMonth);
      const res = await http.get("/payroll", {
        params: { startDate, endDate, periodType: "monthly" },
      });
      setRecords(res.data.records || []);
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

  // "Download PDF" (whole report) button and each guard's
  const downloadReport = (recordsToExport, { searchLabel = "" } = {}) => {
    setDownloadMessage(null);
    setIsDownloadingPDF(true);
    try {
      const result = generatePayrollPDF({
        records: recordsToExport,
        monthLabel: MONTHS[selectedMonth],
        year: selectedYear,
        companyName: companyName || "Payroll Report",
        searchTerm: searchLabel,
      });

      if (!result.success) {
        setDownloadMessage({
          type: result.error === "empty" ? "info" : "error",
          text: result.message || "Could not generate the PDF. Please try again.",
        });
      }
    } catch (err) {
      console.error("Unexpected error generating payroll PDF:", err);
      setDownloadMessage({ type: "error", text: "Something went wrong while generating the PDF. Please try again." });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadPDF = () => downloadReport(filtered, { searchLabel: searchTerm });

  // Exports just one guard's report
  const handleDownloadGuardPDF = (record) =>
    downloadReport([record], { searchLabel: record.guardName });

  const hasDownloadableData = filtered.some((r) =>
    (r.entries || []).some((e) => e.attendanceStatus === "present" || e.actualHours > 0)
  );

  return (
    <div className="payroll-page">
      <div className="payroll-container">

        {/* Page header - title + month picker */}
        <div className="payroll-header-row">
          <h1 className="payroll-title">{t.payroll}</h1>
          <div className="payroll-period" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RefreshButton
              onRefresh={() => fetchPayroll(true)}
              isRefreshing={isRefreshing}
              lastRefreshed={lastRefreshed}
            />
            <button
              type="button"
              className="payroll-download-btn"
              onClick={handleDownloadPDF}
              disabled={loading || isDownloadingPDF || !hasDownloadableData}
              title={!hasDownloadableData ? "No completed shifts to export" : "Download this report as a PDF"}
            >
              {isDownloadingPDF ? (
                "Preparing PDF..."
              ) : (
                <>
                  <span className="payroll-download-icon" aria-hidden="true">⬇</span>
                  Download PDF
                </>
              )}
            </button>
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

        {downloadMessage && (
          <div
            className={`payroll-status ${downloadMessage.type === "error" ? "payroll-status--error" : "payroll-status--info"}`}
          >
            {downloadMessage.text}
          </div>
        )}

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
                          <td>{formatDate(entry.shiftDate)}</td>
                          <td>{entry.location || "—"}</td>
                          <td>{entry.actualHours ?? entry.scheduledHours}</td>
                          <td>${entry.payRate}/hr</td>
                          <td>{formatCurrency(entry.totalPay)}</td>
                        </tr>
                      ))}
                      <tr className="payroll-total-row">
                        <td colSpan={5} className="payroll-total-label">TOTAL</td>
                        <td className="payroll-total-amount">
                          <div className="payroll-total-amount-row">
                            <span>{formatCurrency(record.grossPay)}</span>
                            <button
                              type="button"
                              className="payroll-guard-download-btn"
                              onClick={() => handleDownloadGuardPDF(record)}
                              disabled={isDownloadingPDF}
                              title={`Download ${record.guardName}'s payroll report`}
                            >
                              <span className="payroll-download-icon" aria-hidden="true">⬇</span>
                              PDF
                            </button>
                          </div>
                        </td>
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
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployerDashboard.css";

/* --- icons --- */
const IconCalendar = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconClock = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    <line x1="12" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconGrid = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" />
    <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" />
    <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" />
    <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" />
  </svg>
);

const IconList = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <rect x="3" y="4" width="18" height="3" rx="1" fill="currentColor" />
    <rect x="3" y="10.5" width="18" height="3" rx="1" fill="currentColor" />
    <rect x="3" y="17" width="18" height="3" rx="1" fill="currentColor" />
  </svg>
);

const IconUser = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="8" r="4" fill="currentColor" />
    <path d="M4 20c0-4.4183 3.5817-8 8-8s8 3.5817 8 8" fill="currentColor" />
  </svg>
);

const Star = ({ filled }) => (
  <svg viewBox="0 0 24 24" className={`star ${filled ? "filled" : ""}`}>
    <path d="M12 2l3.09 6.28 6.93 1-5 4.86L18.18 22 12 18.56 5.82 22l1.16-7.86-5-4.86 6.93-1L12 2z" />
  </svg>
);

const severityRank = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const formatLocation = (location) => {
  if (!location) return "No location";
  if (typeof location === "string") return location;

  return [location.street, location.suburb, location.state, location.postcode]
    .filter(Boolean)
    .join(", ");
};

const formatShiftDate = (value) => {
  if (!value) return "--";
  if (typeof value !== "string") return String(value);

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) return value;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-GB");
};

const parseIncidentDateTime = (incident) => {
  const [day, month, year] = incident.date.split("-").map(Number);
  const baseDate = new Date(year, month - 1, day);
  const timeMatch = incident.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

  if (!timeMatch) return baseDate.getTime();

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const meridian = timeMatch[3].toUpperCase();

  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  baseDate.setHours(hours, minutes, 0, 0);
  return baseDate.getTime();
};

const getShiftStatusCategory = (shift) => {
  const text = String(shift?.status?.text || "").toLowerCase();
  const tone = String(shift?.status?.tone || "").toLowerCase();

  if (tone.includes("pending") || text.includes("pending")) return "Pending";
  if (tone.includes("completed") || text.includes("completed")) return "Completed";
  if (
    tone.includes("confirmed") ||
    tone.includes("open") ||
    text.includes("confirmed") ||
    text.includes("open")
  ) {
    return "Open";
  }

  return "All";
};

export default function EmployerDashboard() {
  const [view, setView] = useState("list");
  const reviewScroller = useRef(null);
  const navigate = useNavigate();

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusTab, setStatusTab] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentDraft, setIncidentDraft] = useState({ severity: "Medium", comments: "" });
  const [incidentQuery, setIncidentQuery] = useState("");
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("All");
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState("All");
  const [incidentSort, setIncidentSort] = useState("Newest");

  const [requests, setRequests] = useState([
    {
      id: "REQ-1001",
      type: "Shift Swap",
      employee: "John Doe",
      shift: "Crowd Control - Marvel Stadium",
      requestDate: "28-04-2026",
      reason: "Requested shift swap due to university exam.",
      status: "Pending",
    },
    {
      id: "REQ-1002",
      type: "Leave",
      employee: "Amy Huggins",
      shift: "Shopping Centre Security - Chadstone",
      requestDate: "29-04-2026",
      reason: "Medical appointment.",
      status: "Pending",
    },
    {
      id: "REQ-1003",
      type: "Shift Swap",
      employee: "Andrew Goddard",
      shift: "Event Security - Rod Laver Arena",
      requestDate: "30-04-2026",
      reason: "Requested swap with another available guard.",
      status: "Approved",
    },
    {
      id: "REQ-1004",
      type: "Leave",
      employee: "Amy Huggins",
      shift: "Shopping Centre Security - Chadstone",
      requestDate: "01-05-2026",
      reason: "Family commitment.",
      status: "Rejected",
    },
  ]);

  const [incidents, setIncidents] = useState([
    {
      id: "INC-9921",
      guard: "John Doe",
      shift: "Crowd Control - Marvel",
      date: "09-08-2025",
      time: "10:45 PM",
      status: "Pending",
      severity: "High",
      description:
        "A patron was found attempting to bypass security with restricted items. Incident was recorded and patron escorted out.",
      photos: [
        "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=300&q=80",
      ],
      comments: "",
    },
    {
      id: "INC-9920",
      guard: "Leah Carter",
      shift: "Gate Check - MCG",
      date: "08-08-2025",
      time: "08:15 PM",
      status: "Resolved",
      severity: "Medium",
      description:
        "A disagreement between attendees escalated near Gate 2. Security separated both parties and incident was de-escalated without injury.",
      photos: [],
      comments: "Resolved on site, no further action required.",
    },
    {
      id: "INC-9919",
      guard: "Aiden Ross",
      shift: "Shopping Centre Security - Chadstone",
      date: "07-08-2025",
      time: "03:05 PM",
      status: "Pending",
      severity: "Low",
      description:
        "Minor slip hazard reported in food court area. Zone was isolated and cleaning team notified.",
      photos: [
        "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?auto=format&fit=crop&w=300&q=80",
      ],
      comments: "",
    },
  ]);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/shifts/myshifts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load shifts.");
        }

        const rawShifts = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

        const normalizedShifts = rawShifts.map((shift, idx) => {
          const rawStatus = shift.status;
          const normalizedStatus =
            typeof rawStatus === "object" && rawStatus !== null
              ? {
                  text: rawStatus.text || "Pending",
                  tone: rawStatus.tone || "pending",
                }
              : {
                  text: rawStatus || "Pending",
                  tone:
                    String(rawStatus || "pending").toLowerCase().includes("confirm")
                      ? "confirmed"
                      : String(rawStatus || "pending").toLowerCase().includes("complete")
                        ? "completed"
                        : String(rawStatus || "pending").toLowerCase().includes("reject")
                          ? "rejected"
                          : "pending",
                };

          return {
            id: shift._id || shift.id || idx,
            title: shift.title || shift.role || "Shift",
            location: formatLocation(shift.location || shift.venue),
            date: formatShiftDate(shift.date || shift.shiftDate),
            time:
              shift.startTime && shift.endTime
                ? `${shift.startTime} - ${shift.endTime}`
                : shift.time || "--",
            status: normalizedStatus,
            payRate: shift.payRate ?? shift.rate ?? shift.hourlyRate ?? 0,
            priority:
              shift.priority || (idx % 3 === 0 ? "High" : idx % 3 === 1 ? "Medium" : "Low"),
            assignedGuards: shift.assignedGuards ?? shift.guardsAssigned ?? 0,
          };
        });

        setShifts(normalizedShifts);
      } catch (err) {
        setError(err.message || "Failed to load shifts.");

        setShifts([
          {
            id: 1,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 20, 2026",
            time: "15:04 - 02:04",
            status: { text: "Open", tone: "confirmed" },
            payRate: 23,
            priority: "High",
            assignedGuards: 2,
          },
          {
            id: 2,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 20, 2026",
            time: "15:04 - 02:04",
            status: { text: "Open", tone: "confirmed" },
            payRate: 23,
            priority: "High",
            assignedGuards: 1,
          },
          {
            id: 3,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 20, 2026",
            time: "15:04 - 02:04",
            status: { text: "Open", tone: "confirmed" },
            payRate: 23,
            priority: "High",
            assignedGuards: 3,
          },
          {
            id: 4,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 20, 2026",
            time: "15:04 - 02:04",
            status: { text: "Open", tone: "confirmed" },
            payRate: 23,
            priority: "High",
            assignedGuards: 2,
          },
          {
            id: 5,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 20, 2026",
            time: "15:04 - 02:04",
            status: { text: "Open", tone: "confirmed" },
            payRate: 23,
            priority: "High",
            assignedGuards: 2,
          },
          {
            id: 6,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 21, 2026",
            time: "13:00 - 21:00",
            status: { text: "Pending", tone: "pending" },
            payRate: 25,
            priority: "Medium",
            assignedGuards: 1,
          },
          {
            id: 7,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 22, 2026",
            time: "09:00 - 17:00",
            status: { text: "Completed", tone: "completed" },
            payRate: 24,
            priority: "Low",
            assignedGuards: 4,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  const reviews = useMemo(
    () => [
      {
        name: "Marcus Johnson",
        role: "Downtown Plaza",
        stars: 5,
        text:
          "Always punctual, professional and kept the site secure throughout a difficult overnight shift.",
        date: "May 4, 2025",
      },
      {
        name: "Marcus Johnson",
        role: "Downtown Plaza",
        stars: 5,
        text:
          "Always punctual, professional and kept the site secure throughout a difficult overnight shift.",
        date: "May 4, 2025",
      },
      {
        name: "Marcus Johnson",
        role: "Downtown Plaza",
        stars: 5,
        text:
          "Always punctual, professional and kept the site secure throughout a difficult overnight shift.",
        date: "May 4, 2025",
      },
    ],
    []
  );

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const matchesStatus =
        statusTab === "All" ? true : getShiftStatusCategory(shift) === statusTab;
      const matchesPriority =
        priorityFilter === "All" ? true : String(shift.priority) === priorityFilter;

      return matchesStatus && matchesPriority;
    });
  }, [priorityFilter, shifts, statusTab]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredShifts.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, priorityFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedShifts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShifts.slice(start, start + pageSize);
  }, [currentPage, filteredShifts]);

  const showingStart = filteredShifts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingEnd = Math.min(currentPage * pageSize, filteredShifts.length);

  const tabCounts = useMemo(() => {
    return {
      All: shifts.length,
      Pending: shifts.filter((s) => getShiftStatusCategory(s) === "Pending").length,
      Open: shifts.filter((s) => getShiftStatusCategory(s) === "Open").length,
      Completed: shifts.filter((s) => getShiftStatusCategory(s) === "Completed").length,
    };
  }, [shifts]);

  const filteredIncidents = useMemo(() => {
    const normalizedQuery = incidentQuery.trim().toLowerCase();

    return incidents
      .filter((incident) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          incident.id.toLowerCase().includes(normalizedQuery) ||
          incident.guard.toLowerCase().includes(normalizedQuery) ||
          incident.shift.toLowerCase().includes(normalizedQuery) ||
          incident.description.toLowerCase().includes(normalizedQuery);

        const matchesStatus =
          incidentStatusFilter === "All" || incident.status === incidentStatusFilter;

        const matchesSeverity =
          incidentSeverityFilter === "All" || incident.severity === incidentSeverityFilter;

        return matchesQuery && matchesStatus && matchesSeverity;
      })
      .sort((a, b) => {
        if (incidentSort === "Newest") {
          return parseIncidentDateTime(b) - parseIncidentDateTime(a);
        }
        if (incidentSort === "Oldest") {
          return parseIncidentDateTime(a) - parseIncidentDateTime(b);
        }
        if (incidentSort === "Severity") {
          return (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
        }
        return 0;
      });
  }, [incidents, incidentQuery, incidentSeverityFilter, incidentSort, incidentStatusFilter]);

  const incidentSummary = useMemo(() => {
    return incidents.reduce(
      (acc, incident) => {
        acc.total += 1;
        if (incident.status === "Pending") acc.pending += 1;
        if (incident.status === "Resolved") acc.resolved += 1;
        return acc;
      },
      { total: 0, pending: 0, resolved: 0 }
    );
  }, [incidents]);

  const pendingRequestCount = useMemo(
    () => requests.filter((req) => req.status === "Pending").length,
    [requests]
  );

  const updateIncident = (id, newStatus, newSeverity, newComments) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id ? { ...inc, status: newStatus, severity: newSeverity, comments: newComments } : inc
      )
    );
    setSelectedIncident(null);
  };

  const openIncidentModal = (incident) => {
    setSelectedIncident(incident);
    setIncidentDraft({
      severity: incident.severity,
      comments: incident.comments || "",
    });
  };

  const updateRequestStatus = (id, newStatus) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    );
  };

  const scrollByAmount = (ref, amt) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: amt, behavior: "smooth" });
  };

  return (
    <div className="ss-page">
      <main className="ss-main">
        <div className="ss-overview-head">
          <div>
            <h2 className="ss-h1">Overview</h2>
            <p className="ss-overview-subtitle">
              {shifts.length} shifts · last updated just now
            </p>
          </div>

          <button
            className="ss-primary ss-primary--wide"
            onClick={() => navigate("/create-shift")}
            type="button"
          >
            <IconPlus className="ss-plus" /> Create Shift
          </button>
        </div>

        <div className="ss-dashboard-card">
          <div className="ss-topbar">
            <div className="ss-tabs">
              {["All", "Pending", "Open", "Completed"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`ss-tab ${statusTab === tab ? "is-active" : ""}`}
                  onClick={() => setStatusTab(tab)}
                >
                  {tab}
                  <span className="ss-tab__count">{tabCounts[tab]}</span>
                </button>
              ))}
            </div>

            <div className="ss-viewtoggle">
              <button
                className={`ss-viewtoggle__btn ${view === "list" ? "is-active" : ""}`}
                onClick={() => setView("list")}
                type="button"
              >
                <IconList />
              </button>
              <button
                className={`ss-viewtoggle__btn ${view === "grid" ? "is-active" : ""}`}
                onClick={() => setView("grid")}
                type="button"
              >
                <IconGrid />
              </button>
            </div>
          </div>

          <div className="ss-filterbar">
            <span className="ss-filterbar__label">Priority</span>
            {["All", "High", "Medium", "Low"].map((chip) => (
              <button
                key={chip}
                type="button"
                className={`ss-chip-btn ${priorityFilter === chip ? "is-active" : ""}`}
                onClick={() => setPriorityFilter(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          {view === "list" ? (
            <div className="ss-table">
              <div className="ss-table__head">
                <div>Shift</div>
                <div>Priority</div>
                <div>Date / Time</div>
                <div>Pay</div>
                <div>Status</div>
              </div>

              {loading && <div className="ss-empty-state">Loading shifts...</div>}
              {error && <div className="ss-empty-state ss-empty-state--error">{error}</div>}
              {!loading && !error && filteredShifts.length === 0 && (
                <div className="ss-empty-state">No shifts match the selected filters.</div>
              )}

              {!loading &&
                !error &&
                paginatedShifts.map((shift) => (
                  <div className="ss-table__row" key={shift.id}>
                    <div className="ss-shift-col">
                      <div className="ss-shift-title">{shift.title}</div>
                      <div className="ss-shift-location">{shift.location}</div>
                    </div>

                    <div>
                      <span
                        className={`ss-badge ss-badge--priority-${String(shift.priority).toLowerCase()}`}
                      >
                        {shift.priority}
                      </span>
                    </div>

                    <div className="ss-datetime-col">
                      <div className="ss-datetime-line">
                        <IconCalendar className="ss-ico" />
                        {shift.date}
                      </div>
                      <div className="ss-datetime-line">
                        <IconClock className="ss-ico" />
                        {shift.time}
                      </div>
                    </div>

                    <div className="ss-pay-col">${shift.payRate}/hr</div>

                    <div>
                      <span
                        className={`ss-badge ss-badge--status-${String(shift.status.tone).toLowerCase()}`}
                      >
                        {shift.status.text}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="ss-shifts ss-shifts--grid ss-grid-view">
              {paginatedShifts.map((shift) => (
                <div className="ss-card" key={shift.id}>
                  <div className="ss-card__head">
                    <div className="ss-role">{shift.title}</div>
                    <div className="ss-rate">${shift.payRate} p/h</div>
                  </div>
                  <div className="ss-meta">{shift.location}</div>
                  <div className="ss-when">
                    <span className="ss-when__item">
                      <IconCalendar className="ss-ico" />
                      {shift.date}
                    </span>
                    <span className="ss-when__item">
                      <IconClock className="ss-ico" />
                      {shift.time}
                    </span>
                  </div>
                  <div className="ss-grid-foot">
                    <span
                      className={`ss-badge ss-badge--priority-${String(shift.priority).toLowerCase()}`}
                    >
                      {shift.priority}
                    </span>
                    <span
                      className={`ss-badge ss-badge--status-${String(shift.status.tone).toLowerCase()}`}
                    >
                      {shift.status.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="ss-pagination">
            <div className="ss-pagination__meta">
              Showing {showingStart}-{showingEnd} of {filteredShifts.length}
            </div>

            <div className="ss-pagination__controls">
              <button
                type="button"
                className="ss-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`ss-page-btn ${currentPage === page ? "is-active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="ss-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <div className="ss-section-head">
          <h2 className="ss-section-title">Shift Swap / Leave Requests</h2>
          <p className="ss-section-subtitle">
            {pendingRequestCount} pending · {requests.length} total
          </p>
        </div>

        <div className="ss-dashboard-card">
          <div className="ss-requests-list">
            {requests.map((req) => (
              <div className="ss-request-row" key={req.id}>
                <div className="ss-request-left">
                  <div className="ss-request-type">{req.type}</div>
                  <div className="ss-request-employee">
                    {req.employee} — {req.shift}
                  </div>
                  <div className="ss-request-reason">{req.reason}</div>
                </div>

                <div className="ss-request-middle">
                  <div className="ss-datetime-line">
                    <IconCalendar className="ss-ico" />
                    {req.requestDate}
                  </div>
                </div>

                <div className="ss-request-actions">
                  <span
                    className={`ss-badge ss-badge--status-${String(req.status).toLowerCase()}`}
                  >
                    {req.status}
                  </span>

                  <button
                    type="button"
                    className="ss-primary"
                    onClick={() => updateRequestStatus(req.id, "Approved")}
                    disabled={req.status === "Approved"}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    className="ss-secondary ss-secondary--danger"
                    onClick={() => updateRequestStatus(req.id, "Rejected")}
                    disabled={req.status === "Rejected"}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ss-section-head">
          <h2 className="ss-section-title">Incident Reports</h2>
          <p className="ss-section-subtitle">
            {incidentSummary.pending} pending · {incidentSummary.total} total
          </p>
        </div>

        <div className="ss-dashboard-card">
          <div className="ss-incident-toolbar">
            <input
              className="ss-incident-search"
              placeholder="Search by incident ID, guard, shift or description"
              value={incidentQuery}
              onChange={(e) => setIncidentQuery(e.target.value)}
            />
            <select value={incidentStatusFilter} onChange={(e) => setIncidentStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select value={incidentSeverityFilter} onChange={(e) => setIncidentSeverityFilter(e.target.value)}>
              <option value="All">All Severities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select value={incidentSort} onChange={(e) => setIncidentSort(e.target.value)}>
              <option value="Newest">Sort Newest</option>
              <option value="Oldest">Sort Oldest</option>
              <option value="Severity">Sort Severity</option>
            </select>
            <button
              className="ss-reset-btn"
              type="button"
              onClick={() => {
                setIncidentQuery("");
                setIncidentStatusFilter("All");
                setIncidentSeverityFilter("All");
                setIncidentSort("Newest");
              }}
            >
              Reset
            </button>
          </div>

          <div className="ss-incident-summary">
            <span>{incidentSummary.total} Total</span>
            <span>{incidentSummary.pending} Pending</span>
            <span>{incidentSummary.resolved} Resolved</span>
            <span>{filteredIncidents.length} Showing</span>
          </div>

          <div className="ss-incident-list">
            {filteredIncidents.length === 0 && (
              <div className="ss-empty-state">No incident reports match the current filters.</div>
            )}

            {filteredIncidents.map((inc) => (
              <div className="ss-incident-row" key={inc.id}>
                <div className="ss-incident-row__line" />
                <div className="ss-incident-avatar">
                  {inc.guard
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div className="ss-incident-person">
                  <div className="ss-incident-name">{inc.guard}</div>
                </div>

                <div className="ss-incident-shift">{inc.shift}</div>

                <div className="ss-incident-id">{inc.id}</div>

                <div className="ss-incident-date">
                  <IconCalendar className="ss-ico" />
                  {inc.date}
                </div>

                <div className="ss-incident-badges">
                  <span className={`ss-badge ss-badge--priority-${inc.severity.toLowerCase()}`}>
                    {inc.severity}
                  </span>
                  <span
                    className={`ss-badge ss-badge--status-${inc.status === "Resolved" ? "completed" : "pending"}`}
                  >
                    {inc.status}
                  </span>
                </div>

                <button
                  className="ss-review-btn"
                  type="button"
                  onClick={() => openIncidentModal(inc)}
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="ss-section-head ss-section-head--reviews">
          <h2 className="ss-section-title">Recent Reviews</h2>
          <div className="ss-review-arrows">
            <button className="ss-mini-arrow" onClick={() => scrollByAmount(reviewScroller, -300)} type="button">
              ‹
            </button>
            <button className="ss-mini-arrow" onClick={() => scrollByAmount(reviewScroller, 300)} type="button">
              ›
            </button>
          </div>
        </div>

        <div className="ss-dashboard-card ss-dashboard-card--reviews">
          <div ref={reviewScroller} className="ss-reviews__track">
            {reviews.map((r, i) => (
              <div key={i} className="ss-reviewcard">
                <div className="ss-reviewcard__top">
                  <div className="ss-avatar ss-avatar--lg">
                    <IconUser />
                  </div>
                  <div>
                    <div className="ss-review__name">{r.name}</div>
                    <div className="ss-review__role">{r.role}</div>
                  </div>
                </div>

                <div className="ss-review__stars">
                  {[0, 1, 2, 3, 4].map((k) => (
                    <Star key={k} filled={k < r.stars} />
                  ))}
                </div>

                <p className="ss-review__text">“{r.text}”</p>
                <div className="ss-review__date">{r.date}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {selectedIncident && (
        <div className="create-shift-modal-backdrop" onClick={() => setSelectedIncident(null)}>
          <div
            className="create-shift-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px" }}
          >
            <div className="create-shift-header">
              <div>
                <h1>
                  Incident Details (<span className="ss-incident-id">{selectedIncident.id}</span>)
                </h1>
                <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                  Recorded on: {selectedIncident.date} at {selectedIncident.time}
                </p>
              </div>
              <span
                className={`ss-badge ss-badge--status-${
                  selectedIncident.status === "Resolved" ? "completed" : "pending"
                }`}
              >
                {selectedIncident.status}
              </span>
            </div>

            <div className="form-grid" style={{ marginBottom: "20px" }}>
              <div className="form-group">
                <label>Reported By</label>
                <div className="ss-input-static" style={{ padding: "10px", borderRadius: "4px" }}>
                  {selectedIncident.guard}
                </div>
              </div>
              <div className="form-group">
                <label>Assign Severity Level</label>
                <select
                  value={incidentDraft.severity}
                  onChange={(e) => setIncidentDraft((prev) => ({ ...prev, severity: e.target.value }))}
                  style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label>Guard&apos;s Description</label>
              <div className="ss-incident-description">{selectedIncident.description}</div>
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label>Evidence Photos</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {(selectedIncident.photos || []).map((url, idx) => (
                  <img key={idx} src={url} alt="incident evidence" className="ss-evidence-img" />
                ))}
                {(!selectedIncident.photos || selectedIncident.photos.length === 0) && (
                  <p style={{ margin: 0, color: "#666" }}>No evidence photos attached.</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Employer Comments</label>
              <textarea
                placeholder="Add internal notes..."
                value={incidentDraft.comments}
                onChange={(e) => setIncidentDraft((prev) => ({ ...prev, comments: e.target.value }))}
                style={{ border: "1px solid #ddd", borderRadius: "4px", padding: "10px" }}
                rows={4}
              />
            </div>

            <div className="actions" style={{ marginTop: "30px" }}>
              <button
                className="primary"
                onClick={() =>
                  updateIncident(
                    selectedIncident.id,
                    "Resolved",
                    incidentDraft.severity,
                    incidentDraft.comments
                  )
                }
              >
                Mark as Resolved
              </button>
              <button
                className="secondary"
                onClick={() =>
                  updateIncident(
                    selectedIncident.id,
                    "Pending",
                    incidentDraft.severity,
                    incidentDraft.comments
                  )
                }
              >
                Save as Pending
              </button>
              <button
                className="secondary"
                style={{ color: "#666" }}
                onClick={() => setSelectedIncident(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployerDashboard.css";
import translations from '../i18n/translations';

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

const LONG_SHIFT_HOURS = 12;
const MIN_REST_HOURS = 12;

const splitTimeRange = (value) => {
  if (!value) return { start: null, end: null };
  const parts = String(value)
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) return { start: parts[0], end: parts[1] };
  return { start: parts[0] || null, end: null };
};

const parseShiftDateTime = (dateValue, timeValue) => {
  if (!dateValue) return null;

  let baseDate = null;
  if (dateValue instanceof Date) {
    baseDate = new Date(dateValue);
  } else {
    const dateStr = String(dateValue).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split("-").map(Number);
      baseDate = new Date(year, month - 1, day);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const datePart = dateStr.slice(0, 10);
      const [year, month, day] = datePart.split("-").map(Number);
      baseDate = new Date(year, month - 1, day);
    } else {
      const parsed = new Date(dateStr);
      if (!Number.isNaN(parsed.getTime())) {
        baseDate = parsed;
      }
    }
  }

  if (!baseDate || Number.isNaN(baseDate.getTime())) return null;
  if (!timeValue) return baseDate;

  const timeStr = String(timeValue).trim();
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!timeMatch) return baseDate;

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const meridian = (timeMatch[3] || "").toUpperCase();

  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
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
  const [expandedGuard, setExpandedGuard] = useState(null);

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
          const guardName =
            shift.guardName ||
            (typeof shift.guard === "string" ? shift.guard : null) ||
            shift.guard?.name ||
            shift.guard?.fullName ||
            shift.acceptedBy?.name ||
            shift.acceptedBy?.fullName ||
            (typeof shift.acceptedBy === "string" ? shift.acceptedBy : null) ||
            shift.assignedGuard?.name ||
            shift.assignedGuard?.fullName ||
            (typeof shift.assignedGuard === "string" ? shift.assignedGuard : null) ||
            shift.user?.name ||
            shift.user?.fullName ||
            null;
          const startTime = shift.startTime || shift.start || null;
          const endTime = shift.endTime || shift.end || null;
          const rawDate = shift.date || shift.shiftDate || null;
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
            title: shift.title || shift.role || "Shift 1",
            location: formatLocation(shift.location || shift.venue),
            date: formatShiftDate(shift.date || shift.shiftDate),
            rawDate,
            time:
              shift.startTime && shift.endTime
                ? `${shift.startTime} - ${shift.endTime}`
                : shift.time || "--",
            startTime,
            endTime,
            status: normalizedStatus,
            payRate: shift.payRate ?? shift.rate ?? shift.hourlyRate ?? 0,
            priority:
              shift.priority || (idx % 3 === 0 ? "High" : idx % 3 === 1 ? "Medium" : "Low"),
            guardName,
            guard: shift.guard || null,
            acceptedBy: shift.acceptedBy || null,
            assignedGuard: shift.assignedGuard || null,
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
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  useEffect(() => {
    if (!expandedGuard) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setExpandedGuard(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedGuard]);

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

  const fatigueData = useMemo(() => {
    const guardMap = new Map();

    shifts.forEach((shift) => {
      const guardName =
        shift.guardName ||
        (typeof shift.guard === "string" ? shift.guard : null) ||
        shift.guard?.name ||
        shift.guard?.fullName ||
        shift.acceptedBy?.name ||
        shift.acceptedBy?.fullName ||
        (typeof shift.acceptedBy === "string" ? shift.acceptedBy : null) ||
        shift.assignedGuard?.name ||
        shift.assignedGuard?.fullName ||
        (typeof shift.assignedGuard === "string" ? shift.assignedGuard : null) ||
        shift.user?.name ||
        shift.user?.fullName ||
        null;
      if (!guardName) return;

      const { start: rangeStart, end: rangeEnd } = splitTimeRange(shift.time);
      const startLabel = shift.startTime || rangeStart;
      const endLabel = shift.endTime || rangeEnd;
      const start = parseShiftDateTime(shift.rawDate || shift.date, startLabel);
      const end = parseShiftDateTime(shift.rawDate || shift.date, endLabel);

      if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

      const startTime = start.getTime();
      let endTime = end.getTime();

      if (endTime <= startTime) {
        endTime += 24 * 60 * 60 * 1000;
      }

      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      if (durationHours <= 0 || durationHours > 23) return;

      if (!guardMap.has(guardName)) {
        guardMap.set(guardName, []);
      }

      guardMap.get(guardName).push({
        startTime,
        endTime,
        durationHours,
        title: shift.title || "Shift",
        date: shift.rawDate || shift.date,
        startLabel: startLabel || "--",
        endLabel: endLabel || "--",
        location: shift.location,
        status: shift.status?.text || shift.status || "Open",
      });
    });

    const guards = Array.from(guardMap.entries()).map(([guard, guardShifts]) => {
      const sorted = [...guardShifts].sort((a, b) => a.startTime - b.startTime);
      let longShiftCount = 0;
      let consecutiveCount = 0;
      let minRestGap = Number.POSITIVE_INFINITY;

      sorted.forEach((shift, idx) => {
        if (shift.durationHours >= LONG_SHIFT_HOURS) longShiftCount += 1;
        if (idx === 0) return;
        const previous = sorted[idx - 1];
        const restHours = (shift.startTime - previous.endTime) / (1000 * 60 * 60);
        if (restHours >= 0 && restHours < MIN_REST_HOURS) consecutiveCount += 1;
        if (restHours >= 0) minRestGap = Math.min(minRestGap, restHours);
      });

      const restRecommendation = Number.isFinite(minRestGap)
        ? Math.min(100, Math.max(0, Math.round((minRestGap / MIN_REST_HOURS) * 100)))
        : 100;

      return {
        guard,
        longShiftCount,
        consecutiveCount,
        restRecommendation,
        shifts: sorted,
      };
    });

    const overworked = guards.filter(
      (guard) => guard.longShiftCount > 0 || guard.consecutiveCount > 0
    );

    const avgRestRecommendation = guards.length
      ? Math.round(guards.reduce((sum, guard) => sum + guard.restRecommendation, 0) / guards.length)
      : 0;

    return { guards, overworked, avgRestRecommendation };
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
          <h2 className="ss-section-title">Shift Fatigue Monitoring</h2>
          <p className="ss-section-subtitle">Fatigue signals from recent shifts</p>
        </div>

        <div className="ss-dashboard-card">
          <div className="ss-fatigue">
            <div className="ss-fatigue__summary">
              <div className="ss-fatigue__title">Risk Signals</div>
              <div className="ss-fatigue__stats">
                <div className="ss-fatigue__stat">
                  <div className="ss-fatigue__stat-value">{fatigueData.guards.length}</div>
                  <div className="ss-fatigue__stat-label">Guards Monitored</div>
                </div>
                <div className="ss-fatigue__stat">
                  <div className="ss-fatigue__stat-value">{fatigueData.overworked.length}</div>
                  <div className="ss-fatigue__stat-label">Overworked Guards</div>
                </div>
                <div className="ss-fatigue__stat">
                  <div className="ss-fatigue__stat-value">{fatigueData.avgRestRecommendation}%</div>
                  <div className="ss-fatigue__stat-label">Avg Rest Recommendation</div>
                </div>
              </div>
              <div className="ss-fatigue__note">
                Long shift threshold: {LONG_SHIFT_HOURS}h · Minimum rest target: {MIN_REST_HOURS}h
              </div>
            </div>

            <div className="ss-fatigue__list">
              <div className="ss-fatigue__title">Overworked Guards</div>
              {fatigueData.overworked.length === 0 ? (
                <div className="ss-fatigue__empty">No fatigue risks detected yet.</div>
              ) : (
                <div className="ss-fatigue__rows">
                  {fatigueData.overworked.map((guard) => {
                    const isExpanded = expandedGuard?.guard === guard.guard;
                    return (
                      <div
                        className={`ss-fatigue__row ${isExpanded ? "is-expanded" : ""}`}
                        key={guard.guard}
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedGuard(isExpanded ? null : guard)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setExpandedGuard(isExpanded ? null : guard);
                          }
                        }}
                      >
                        <div className="ss-fatigue__guard">
                          <div className="ss-fatigue__guard-name">{guard.guard}</div>
                          <div className="ss-fatigue__guard-sub">
                            Rest recommendation {guard.restRecommendation}%
                          </div>
                        </div>
                        <div className="ss-fatigue__metric">
                          <span className="ss-fatigue__metric-value">{guard.longShiftCount}</span>
                          <span className="ss-fatigue__metric-label">Long Shifts</span>
                        </div>
                        <div className="ss-fatigue__metric">
                          <span className="ss-fatigue__metric-value">{guard.consecutiveCount}</span>
                          <span className="ss-fatigue__metric-label">Consecutive Shifts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {expandedGuard && (
          <div
            className="ss-fatigue__modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => setExpandedGuard(null)}
          >
            <div className="ss-fatigue__modal" onClick={(event) => event.stopPropagation()}>
              <div className="ss-fatigue__modal-header">
                <div>
                  <div className="ss-fatigue__modal-title">{expandedGuard.guard}</div>
                  <div className="ss-fatigue__guard-sub">
                    Rest recommendation {expandedGuard.restRecommendation}%
                  </div>
                </div>
                <button
                  className="ss-fatigue__modal-close"
                  onClick={() => setExpandedGuard(null)}
                  aria-label="Close fatigue details"
                >
                  ×
                </button>
              </div>
              <div className="ss-fatigue__detail">
                {expandedGuard.shifts.map((shiftItem, index) => {
                  const locationText =
                    typeof shiftItem.location === "string"
                      ? shiftItem.location
                      : shiftItem.location
                        ? [
                            shiftItem.location.street,
                            shiftItem.location.suburb,
                            shiftItem.location.state,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        : "No location";

                  const dateText = shiftItem.date
                    ? new Date(`${shiftItem.date}T00:00:00`).toLocaleDateString()
                    : "--";

                  return (
                    <div className="ss-fatigue__detail-row" key={index}>
                      <div className="ss-fatigue__detail-title">{shiftItem.title}</div>
                      <div className="ss-fatigue__detail-meta">
                        <span>{dateText}</span>
                        <span>
                          {shiftItem.startLabel} - {shiftItem.endLabel}
                        </span>
                        <span>{locationText}</span>
                        <span>Status: {shiftItem.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
          <div className="create-shift-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
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
              <button className="secondary" style={{ color: "#666" }} onClick={() => setSelectedIncident(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
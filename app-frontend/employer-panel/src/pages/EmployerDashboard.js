import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import "./EmployerDashboard.css";
import translations from '../i18n/translations';

/* --- icons --- */
const IconCalendar = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const IconClock = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconGrid = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconList = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <rect x="3" y="4" width="18" height="3" rx="1"/>
    <rect x="3" y="10.5" width="18" height="3" rx="1"/>
    <rect x="3" y="17" width="18" height="3" rx="1"/>
  </svg>
);
const IconUser = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="8" r="4" fill="currentColor"/>
    <path d="M4 20c0-4.4183 3.5817-8 8-8s8 3.5817 8 8" fill="currentColor"/>
  </svg>
);
const Star = ({ filled }) => (
  <svg viewBox="0 0 24 24" className={`star ${filled ? "filled" : ""}`}>
    <path d="M12 2l3.09 6.28 6.93 1-5 4.86L18.18 22 12 18.56 5.82 22l1.16-7.86-5-4.86 6.93-1L12 2z"/>
  </svg>
);

const severityRank = {
  High: 3,
  Medium: 2,
  Low: 1,
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

const parseShiftDateTime = (dateValue, timeValue) => {
  if (!dateValue) return null;

  let year;
  let month;
  let day;

  if (typeof dateValue === "string") {
    const normalizedDate = dateValue.includes("T") ? dateValue.split("T")[0] : dateValue;
    if (normalizedDate.includes("-") && normalizedDate.split("-")[0].length === 4) {
      [year, month, day] = normalizedDate.split("-").map(Number);
    } else if (normalizedDate.includes("-")) {
      [day, month, year] = normalizedDate.split("-").map(Number);
    }
  } else if (dateValue instanceof Date) {
    year = dateValue.getFullYear();
    month = dateValue.getMonth() + 1;
    day = dateValue.getDate();
  }

  if (!year || !month || !day) return null;

  const baseDate = new Date(year, month - 1, day, 0, 0, 0, 0);

  if (!timeValue) return baseDate;

  const timeStr = String(timeValue).trim();
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);

  if (!timeMatch) return baseDate;

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const meridian = (timeMatch[3] || "").toUpperCase();

  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  baseDate.setHours(hours, minutes, 0, 0);
  return baseDate;
};

export default function EmployerDashboard({ language }) {
  const t = translations[language || "en"] || translations.en;
  const [view, setView] = useState("list"); // default list view
  const overviewScroller = useRef(null);
  const reviewScroller = useRef(null);
  const navigate = useNavigate();   
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGuard, setExpandedGuard] = useState(null);

  // States for Incident Management
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentDraft, setIncidentDraft] = useState({ severity: "Medium", comments: "" });
  const [incidentQuery, setIncidentQuery] = useState("");
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("All");
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState("All");
  const [incidentSort, setIncidentSort] = useState("Newest");
  const [incidents, setIncidents] = useState([
    { 
      id: "INC-9921", 
      guard: "John Doe", 
      shift: "Crowd Control - Marvel", 
      date: "09-08-2025", 
      time: "10:45 PM", 
      status: "Pending", 
      severity: "High",
      description: "A patron was found attempting to bypass security with restricted items. Incident was recorded and patron escorted out.",

      // Demo Image
      photos: ["https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=300&q=80"], 
      comments: ""
    },
    {
      id: "INC-9920",
      guard: "Leah Carter",
      shift: "Gate Check - MCG",
      date: "08-08-2025",
      time: "08:15 PM",
      status: "Resolved",
      severity: "Medium",
      description: "A disagreement between attendees escalated near Gate 2. Security separated both parties and incident was de-escalated without injury.",
      photos: [],
      comments: "Resolved on site, no further action required."
    },
    {
      id: "INC-9919",
      guard: "Aiden Ross",
      shift: "Shopping Centre Security - Chadstone",
      date: "07-08-2025",
      time: "03:05 PM",
      status: "Pending",
      severity: "Low",
      description: "Minor slip hazard reported in food court area. Zone was isolated and cleaning team notified.",
      photos: ["https://images.unsplash.com/photo-1517292987719-0369a794ec0f?auto=format&fit=crop&w=300&q=80"],
      comments: ""
    }
  ]);

  // Fetch shifts for the logged-in employer
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/shifts/myshifts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("fetch url:", `${process.env.REACT_APP_API_BASE_URL}/shifts/myshifts`);
        console.log("response status:", response.status);
        console.log("content-type:", response.headers.get("content-type"));
        console.log("response url:", response.url);

        const data = await response.json();
        console.log("shift response:", data);

        if (!response.ok) {
          throw new Error(data.message || "Failed to load shifts.");
        }

        setShifts(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load shifts.");
        console.error(err);
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

  const reviews = useMemo(() => [
    { name: "John Smith", role: "Crowd Control", stars: 5 },
    { name: "Andrew Goddard", role: "Crowd Control", stars: 4 },
    { name: "Amy Huggins", role: "Crowd Control", stars: 4 },
  ], []);

  const scrollByAmount = (ref, amt) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: amt, behavior: "smooth" });
  };

  const updateIncident = (id, newStatus, newSeverity, newComments) => {
    setIncidents(prev => prev.map(inc => 
      inc.id === id ? { ...inc, status: newStatus, severity: newSeverity, comments: newComments } : inc
    ));
    setSelectedIncident(null);
  };

  const openIncidentModal = (incident) => {
    setSelectedIncident(incident);
    setIncidentDraft({
      severity: incident.severity,
      comments: incident.comments || "",
    });
  };

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
        shift.assignedGuard ||
        shift.user?.name ||
        shift.user?.fullName ||
        null;

      if (!guardName) return;

      const start = parseShiftDateTime(shift.date, shift.startTime || shift.start);
      const end = parseShiftDateTime(shift.date, shift.endTime || shift.end);
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
        title: shift.title || shift.role || "Shift",
        date: shift.date,
        startLabel: shift.startTime || shift.start || "--",
        endLabel: shift.endTime || shift.end || "--",
        location: shift.location,
        status: shift.status || "open",
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

      const restRecommendation =
        Number.isFinite(minRestGap)
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
      ? Math.round(
          guards.reduce((sum, guard) => sum + guard.restRecommendation, 0) / guards.length
        )
      : 0;

    return { guards, overworked, avgRestRecommendation };
  }, [shifts]);

  return (
    <div className="ss-page">
  
      {/* -------- Overview -------- */}
      <main className="ss-main">
        <h2 className="ss-h1">{t.overview}</h2>
  
        {/* Controls ABOVE grey grid */}
        <div className="ss-controls">
          <div className="ss-controls-right">
            <button
              className="ss-primary ss-primary--wide"
              onClick={() => navigate("/create-shift")}
            >
              <IconPlus className="ss-plus" /> Create Shift
            </button>
            <div className="ss-viewtoggle">
              <button
                className={`ss-viewtoggle__btn ${view === "grid" ? "is-active" : ""}`}
                onClick={() => setView("grid")}
              >
                <IconGrid />
              </button>
              <button
                className={`ss-viewtoggle__btn ${view === "list" ? "is-active" : ""}`}
                onClick={() => setView("list")}
              >
                <IconList />
              </button>
            </div>
          </div>
        </div>
  
        {/* Grey Grid */}
        <div className="ss-overview">
          <button
            className="ss-arrow ss-arrow--left"
            onClick={() => scrollByAmount(overviewScroller, -320)}
          >
            ‹
          </button>
  
          <div className="ss-panel">
            <div
              ref={overviewScroller}
              className={`ss-shifts ${view === "grid" ? "ss-shifts--grid" : "ss-shifts--list"}`}
            >
  
              
  
              {loading && <div>Loading shifts...</div>}
              {error && <div style={{ color: "red" }}>{error}</div>}
              {!loading && !error && shifts.length === 0 && <div>No shifts yet. Create your first shift.</div>}
  
              {shifts.map((s, idx) => {
                const displayLocation =
                  typeof s.location === "string"
                    ? s.location
                    : s.location
                      ? [s.location.street, s.location.suburb, s.location.state]
                          .filter(Boolean)
                          .join(", ")
                      : "No location";
  
                const displayDate = s.date
                  ? new Date(`${s.date}T00:00:00`).toLocaleDateString()
                  : "--";
  
                const displayTime =
                  s.startTime && s.endTime
                    ? `${s.startTime} - ${s.endTime}`
                    : s.time || "--";
  
                const displayStatus = s.status || "open";
                const displayRate = s.payRate ?? s.rate ?? 0;
                const displayTitle = s.title || s.role || "Shift";
  
                return view === "grid" ? (
                  <div className="ss-card" key={s._id || s.id || idx}>
                    <div className="ss-card__head">
                      <div className="ss-role">{displayTitle}</div>
                      <div className="ss-rate">${displayRate} p/h</div>
                    </div>
  
                    <div className="ss-meta">{displayLocation}</div>
  
                    <div className={`ss-status ss-status--${String(displayStatus).toLowerCase()}`}>
                      Status: {displayStatus}
                    </div>
  
                    <div className="ss-when">
                      <span className="ss-when__item">
                        <IconCalendar className="ss-ico" />
                        {displayDate}
                      </span>
                      <span className="ss-when__item">
                        <IconClock className="ss-ico" />
                        {displayTime}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="ss-row" key={s._id || s.id || idx}>
                    <div className="ss-col ss-role">{displayTitle}</div>
                    <div className="ss-col ss-company">{displayLocation}</div>
                    <div className="ss-col ss-rate">${displayRate} p/h</div>
                    <div className="ss-col ss-date">
                      <IconCalendar className="ss-ico" /> {displayDate}
                    </div>
                    <div className="ss-col ss-time">
                      <IconClock className="ss-ico" /> {displayTime}
                    </div>
                    <div className={`ss-col ss-status ss-status--${String(displayStatus).toLowerCase()}`}>
                      Status: {displayStatus}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
  
          <button
            className="ss-arrow ss-arrow--right"
            onClick={() => scrollByAmount(overviewScroller, 320)}
          >
            ›
          </button>
        </div>

        {/* Shift Fatigue Monitoring */}
        <h2 className="ss-h1 ss-h1--spaced">Shift Fatigue Monitoring</h2>
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
                        <div className="ss-fatigue__guard-sub">Rest recommendation {guard.restRecommendation}%</div>
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

        {expandedGuard && (
          <div
            className="ss-fatigue__modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => setExpandedGuard(null)}
          >
            <div
              className="ss-fatigue__modal"
              onClick={(event) => event.stopPropagation()}
            >
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
                        <span>{shiftItem.startLabel} - {shiftItem.endLabel}</span>
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

        {/* Incident Reports */}
        <h2 className="ss-h1 ss-h1--spaced">{t.incidentReports}</h2>
        <div className="ss-incident-toolbar">
          <input
            className="ss-incident-search"
            placeholder="Search by incident ID, guard, shift, or description"
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
            <option value="Newest">Sort: Newest</option>
            <option value="Oldest">Sort: Oldest</option>
            <option value="Severity">Sort: Severity</option>
          </select>
          <button
            className="ss-secondary"
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
        <div className="ss-overview">
          <div style={{ width: "44px" }}></div>
          <div className="ss-panel">
            <div className="ss-shifts ss-shifts--list">
              {filteredIncidents.length === 0 && (
                <div className="ss-row ss-row--empty">No incident reports match the current filters.</div>
              )}
              {filteredIncidents.map((inc, i) => (
                <div className="ss-row" key={i}>
                  <div className="ss-col ss-role"><b>{inc.guard}</b></div>
                  <div className="ss-col ss-company">{inc.shift}</div>
                  <div className="ss-col ss-incident-id">{inc.id}</div>
                  <div className="ss-col ss-date">
                    <IconCalendar className="ss-ico" /> {inc.date}
                  </div>
                  <div className={`ss-col ss-status ss-status--${inc.status.toLowerCase()}`}>
                    {inc.status}
                  </div>
                  <div className="ss-col ss-time" style={{ textAlign: "right" }}>
                    <button className="ss-secondary" style={{ width: '100px' }} onClick={() => openIncidentModal(inc)}>Review</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ width: "44px" }}></div>
        </div>

        {/* Reviews */}
        <h2 className="ss-h1 ss-h1--spaced">{t.recentReview}</h2>
        <div className="ss-reviews">
          <button className="ss-arrow ss-arrow--left" onClick={() => scrollByAmount(reviewScroller, -300)}>‹</button>
          <div ref={reviewScroller} className="ss-reviews__track">
            {reviews.map((r, i) => (
              <div key={i} className="ss-reviewcard">
                <div className="ss-reviewcard__top">
                  <div className="ss-avatar ss-avatar--lg"><IconUser /></div>
                  <div>
                    <div className="ss-review__name">{r.name}</div>
                    <div className="ss-review__role">{r.role}</div>
                  </div>
                </div>
                <div className="ss-review__stars">
                  {[0,1,2,3,4].map((k) => <Star key={k} filled={k < r.stars} />)}
                </div>
                <button className="ss-secondary">View Review</button>
              </div>
            ))}
          </div>
          <button className="ss-arrow ss-arrow--right" onClick={() => scrollByAmount(reviewScroller, 300)}>›</button>
        </div>
      </main>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="create-shift-modal-backdrop" onClick={() => setSelectedIncident(null)}>
          <div className="create-shift-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="create-shift-header">
              <div>
                <h1>Incident Details (<span className="ss-incident-id">{selectedIncident.id}</span>)</h1>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Recorded on: {selectedIncident.date} at {selectedIncident.time}
                </p>
              </div>
              <span className={`ss-status ss-status--${selectedIncident.status.toLowerCase()}`}>
                {selectedIncident.status}
              </span>
            </div>

            <div className="form-grid" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label>Reported By</label>
                <div className="ss-input-static" style={{ padding: '10px', borderRadius: '4px' }}>{selectedIncident.guard}</div>
              </div>
              <div className="form-group">
                <label>Assign Severity Level</label>
                <select
                  value={incidentDraft.severity}
                  onChange={(e) => setIncidentDraft((prev) => ({ ...prev, severity: e.target.value }))}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Guard's Description</label>
              <div className="ss-incident-description">{selectedIncident.description}</div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Evidence Photos</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(selectedIncident.photos || []).map((url, idx) => (
                  <img key={idx} src={url} alt="incident evidence" className="ss-evidence-img" />
                ))}
                {(!selectedIncident.photos || selectedIncident.photos.length === 0) && (
                  <p style={{ margin: 0, color: '#666' }}>No evidence photos attached.</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Employer Comments</label>
              <textarea
                placeholder="Add internal notes..."
                value={incidentDraft.comments}
                onChange={(e) => setIncidentDraft((prev) => ({ ...prev, comments: e.target.value }))}
                style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}
                rows={4}
              />
            </div>

            <div className="actions" style={{ marginTop: '30px' }}>
              <button
                className="primary"
                onClick={() => updateIncident(selectedIncident.id, "Resolved", incidentDraft.severity, incidentDraft.comments)}
              >
                Mark as Resolved
              </button>
              <button
                className="secondary"
                onClick={() => updateIncident(selectedIncident.id, "Pending", incidentDraft.severity, incidentDraft.comments)}
              >
                Save as Pending
              </button>
              <button className="secondary" style={{ color: '#666' }} onClick={() => setSelectedIncident(null)}>Close</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

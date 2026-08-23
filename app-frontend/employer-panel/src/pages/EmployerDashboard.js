import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { jsPDF } from "jspdf";
import "./EmployerDashboard.css";

/* ---------------- ICONS ---------------- */

const IconCalendar = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line
      x1="3"
      y1="10"
      x2="21"
      y2="10"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line
      x1="8"
      y1="2"
      x2="8"
      y2="6"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line
      x1="16"
      y1="2"
      x2="16"
      y2="6"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const IconClock = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line
      x1="12"
      y1="6"
      x2="12"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="12"
      x2="16"
      y2="14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <line
      x1="12"
      y1="5"
      x2="12"
      y2="19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="5"
      y1="12"
      x2="19"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
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
    <rect
      x="3"
      y="10.5"
      width="18"
      height="3"
      rx="1"
      fill="currentColor"
    />
    <rect x="3" y="17" width="18" height="3" rx="1" fill="currentColor" />
  </svg>
);

const IconUser = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="8" r="4" fill="currentColor" />
    <path
      d="M4 20c0-4.4183 3.5817-8 8-8s8 3.5817 8 8"
      fill="currentColor"
    />
  </svg>
);

const IconDownload = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M12 3v12m0 0 5-5m-5 5-5-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 20h14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const Star = ({ filled }) => (
  <svg viewBox="0 0 24 24" className={`star ${filled ? "filled" : ""}`}>
    <path d="M12 2l3.09 6.28 6.93 1-5 4.86L18.18 22 12 18.56 5.82 22l1.16-7.86-5-4.86 6.93-1L12 2z" />
  </svg>
);

/* ---------------- HELPERS ---------------- */

const severityRank = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const formatLocation = (location) => {
  if (!location) return "No location";
  if (typeof location === "string") return location;

  return [
    location.street,
    location.suburb,
    location.state,
    location.postcode,
  ]
    .filter(Boolean)
    .join(", ");
};

const formatShiftDate = (value) => {
  if (!value) return "--";
  if (typeof value !== "string") return String(value);
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) return value;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-GB");
};

const parseIncidentDateTime = (incident) => {
  if (!incident?.date) return 0;

  const [day, month, year] = String(incident.date)
    .split("-")
    .map(Number);

  const baseDate = new Date(year, month - 1, day);

  if (!incident?.time) {
    return baseDate.getTime();
  }

  const timeMatch = String(incident.time).match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)/i
  );

  if (!timeMatch) {
    return baseDate.getTime();
  }

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

  if (tone.includes("pending") || text.includes("pending")) {
    return "Pending";
  }

  if (tone.includes("completed") || text.includes("completed")) {
    return "Completed";
  }

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

const safePdfValue = (value, fallback = "Not provided") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
};

/* ---------------- COMPONENT ---------------- */

export default function EmployerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reviewScroller = useRef(null);

  const [view, setView] = useState("list");

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusTab, setStatusTab] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedIncident, setSelectedIncident] = useState(null);

  const [incidentDraft, setIncidentDraft] = useState({
    severity: "Medium",
    comments: "",
  });

  const [incidentQuery, setIncidentQuery] = useState("");
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("All");
  const [incidentSeverityFilter, setIncidentSeverityFilter] =
    useState("All");
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

  /* ---------------- SHIFT DATA ---------------- */

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/shifts/myshifts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load shifts.");
        }

        const rawShifts = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

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
                  tone: String(rawStatus || "pending")
                    .toLowerCase()
                    .includes("confirm")
                    ? "confirmed"
                    : String(rawStatus || "pending")
                          .toLowerCase()
                          .includes("complete")
                      ? "completed"
                      : String(rawStatus || "pending")
                            .toLowerCase()
                            .includes("reject")
                        ? "rejected"
                        : "pending",
                };

          return {
            id: shift._id || shift.id || idx,
            title: shift.title || shift.role || "Shift 1",
            location: formatLocation(
              shift.location || shift.venue
            ),
            date: formatShiftDate(
              shift.date || shift.shiftDate
            ),
            time:
              shift.startTime && shift.endTime
                ? `${shift.startTime} - ${shift.endTime}`
                : shift.time || "--",
            status: normalizedStatus,
            payRate:
              shift.payRate ??
              shift.rate ??
              shift.hourlyRate ??
              0,
            priority:
              shift.priority ||
              (idx % 3 === 0
                ? "High"
                : idx % 3 === 1
                  ? "Medium"
                  : "Low"),
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
            status: {
              text: "Open",
              tone: "confirmed",
            },
            payRate: 23,
            priority: "High",
          },
          {
            id: 2,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 20, 2026",
            time: "15:04 - 02:04",
            status: {
              text: "Open",
              tone: "confirmed",
            },
            payRate: 23,
            priority: "High",
          },
          {
            id: 3,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 20, 2026",
            time: "15:04 - 02:04",
            status: {
              text: "Open",
              tone: "confirmed",
            },
            payRate: 23,
            priority: "High",
          },
          {
            id: 4,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 20, 2026",
            time: "15:04 - 02:04",
            status: {
              text: "Open",
              tone: "confirmed",
            },
            payRate: 23,
            priority: "High",
          },
          {
            id: 5,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 20, 2026",
            time: "15:04 - 02:04",
            status: {
              text: "Open",
              tone: "confirmed",
            },
            payRate: 23,
            priority: "High",
          },
          {
            id: 6,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 21, 2026",
            time: "13:00 - 21:00",
            status: {
              text: "Pending",
              tone: "pending",
            },
            payRate: 25,
            priority: "Medium",
          },
          {
            id: 7,
            title: "Shift 1",
            location: "740 Bourke St, Docklands VIC",
            date: "Mar 22, 2026",
            time: "09:00 - 17:00",
            status: {
              text: "Completed",
              tone: "completed",
            },
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

  /* ---------------- REVIEWS ---------------- */

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

  /* ---------------- SHIFT FILTERING ---------------- */

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const matchesStatus =
        statusTab === "All"
          ? true
          : getShiftStatusCategory(shift) === statusTab;

      const matchesPriority =
        priorityFilter === "All"
          ? true
          : String(shift.priority) === priorityFilter;

      return matchesStatus && matchesPriority;
    });
  }, [priorityFilter, shifts, statusTab]);

  const pageSize = 5;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredShifts.length / pageSize)
  );

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

    return filteredShifts.slice(
      start,
      start + pageSize
    );
  }, [currentPage, filteredShifts]);

  const showingStart =
    filteredShifts.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const showingEnd = Math.min(
    currentPage * pageSize,
    filteredShifts.length
  );

  const tabCounts = useMemo(() => {
    return {
      All: shifts.length,
      Pending: shifts.filter(
        (s) => getShiftStatusCategory(s) === "Pending"
      ).length,
      Open: shifts.filter(
        (s) => getShiftStatusCategory(s) === "Open"
      ).length,
      Completed: shifts.filter(
        (s) => getShiftStatusCategory(s) === "Completed"
      ).length,
    };
  }, [shifts]);

  /* ---------------- INCIDENT FILTERING ---------------- */

  const filteredIncidents = useMemo(() => {
    const normalizedQuery = incidentQuery
      .trim()
      .toLowerCase();

    return incidents
      .filter((incident) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          safePdfValue(incident.id, "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          safePdfValue(incident.guard, "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          safePdfValue(incident.shift, "")
            .toLowerCase()
            .includes(normalizedQuery) ||
          safePdfValue(incident.description, "")
            .toLowerCase()
            .includes(normalizedQuery);

        const matchesStatus =
          incidentStatusFilter === "All" ||
          incident.status === incidentStatusFilter;

        const matchesSeverity =
          incidentSeverityFilter === "All" ||
          incident.severity === incidentSeverityFilter;

        return (
          matchesQuery &&
          matchesStatus &&
          matchesSeverity
        );
      })
      .sort((a, b) => {
        if (incidentSort === "Newest") {
          return (
            parseIncidentDateTime(b) -
            parseIncidentDateTime(a)
          );
        }

        if (incidentSort === "Oldest") {
          return (
            parseIncidentDateTime(a) -
            parseIncidentDateTime(b)
          );
        }

        if (incidentSort === "Severity") {
          return (
            (severityRank[b.severity] || 0) -
            (severityRank[a.severity] || 0)
          );
        }

        return 0;
      });
  }, [
    incidents,
    incidentQuery,
    incidentSeverityFilter,
    incidentSort,
    incidentStatusFilter,
  ]);

  const incidentSummary = useMemo(() => {
    return incidents.reduce(
      (acc, incident) => {
        acc.total += 1;

        if (incident.status === "Pending") {
          acc.pending += 1;
        }

        if (incident.status === "Resolved") {
          acc.resolved += 1;
        }

        return acc;
      },
      {
        total: 0,
        pending: 0,
        resolved: 0,
      }
    );
  }, [incidents]);

  /* ---------------- INCIDENT ACTIONS ---------------- */

  const updateIncident = (
    id,
    newStatus,
    newSeverity,
    newComments
  ) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: newStatus,
              severity: newSeverity,
              comments: newComments,
            }
          : inc
      )
    );

    setSelectedIncident(null);
  };

  const openIncidentModal = (incident) => {
    setSelectedIncident(incident);

    setIncidentDraft({
      severity: incident?.severity || "Medium",
      comments: incident?.comments || "",
    });
  };

  /* ---------------- PDF DOWNLOAD ---------------- */

  const handleDownloadIncidentPdf = (incident) => {
    if (!incident) {
      window.alert(
        "Incident information is unavailable."
      );
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      const margin = 18;
      const contentWidth =
        pageWidth - margin * 2;

      let y = 20;

      const ensureSpace = (required = 15) => {
        if (y + required >= pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
      };

      const addWrappedText = (
        text,
        fontSize = 10,
        spacingAfter = 5
      ) => {
        ensureSpace(20);

        doc.setFontSize(fontSize);

        const lines = doc.splitTextToSize(
          safePdfValue(text),
          contentWidth
        );

        doc.text(lines, margin, y);

        y += lines.length * 5 + spacingAfter;
      };

      const addField = (label, value) => {
        ensureSpace(15);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(90, 100, 120);

        doc.text(label.toUpperCase(), margin, y);

        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(25, 25, 25);

        const lines = doc.splitTextToSize(
          safePdfValue(value),
          contentWidth
        );

        doc.text(lines, margin, y);

        y += lines.length * 5 + 5;
      };

      /* Header */

      doc.setFillColor(10, 43, 102);
      doc.rect(
        0,
        0,
        pageWidth,
        32,
        "F"
      );

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);

      doc.text("SecureShift", margin, 14);

      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");

      doc.text(
        "Incident Report",
        margin,
        23
      );

      y = 42;

      /* Incident title */

      doc.setTextColor(10, 43, 102);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);

      doc.text(
        safePdfValue(
          incident.id,
          "Incident Report"
        ),
        margin,
        y
      );

      y += 8;

      doc.setDrawColor(220, 225, 235);
      doc.line(
        margin,
        y,
        pageWidth - margin,
        y
      );

      y += 8;

      /* Details */

      addField(
        "Reported By",
        incident.guard
      );

      addField(
        "Shift / Location",
        incident.shift
      );

      addField(
        "Date",
        incident.date
      );

      addField(
        "Time",
        incident.time
      );

      addField(
        "Status",
        incident.status
      );

      addField(
        "Severity",
        incident.severity
      );

      /* Description */

      ensureSpace(25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(10, 43, 102);

      doc.text(
        "Incident Description",
        margin,
        y
      );

      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(25, 25, 25);

      addWrappedText(
        incident.description
      );

      /* Comments */

      ensureSpace(25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(10, 43, 102);

      doc.text(
        "Employer Comments",
        margin,
        y
      );

      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(25, 25, 25);

      addWrappedText(
        incident.comments ||
          "No employer comments recorded."
      );

      /* Evidence */

      ensureSpace(25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(10, 43, 102);

      doc.text("Evidence", margin, y);

      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(25, 25, 25);

      const evidenceCount =
        Array.isArray(incident.photos)
          ? incident.photos.length
          : 0;

      doc.text(
        evidenceCount > 0
          ? `${evidenceCount} evidence photo${
              evidenceCount === 1 ? "" : "s"
            } attached to this incident.`
          : "No evidence photos attached.",
        margin,
        y
      );

      y += 12;

      /* Footer */

      ensureSpace(20);

      doc.setDrawColor(225, 230, 238);

      doc.line(
        margin,
        y,
        pageWidth - margin,
        y
      );

      y += 6;

      doc.setTextColor(110, 120, 135);
      doc.setFontSize(8);

      doc.text(
        `Generated by SecureShift on ${new Date().toLocaleString()}`,
        margin,
        y
      );

      const safeId = safePdfValue(
        incident.id,
        "incident"
      ).replace(
        /[^a-zA-Z0-9-_]/g,
        "-"
      );

      doc.save(
        `SecureShift-${safeId}.pdf`
      );
    } catch (err) {
      console.error(
        "Incident PDF generation failed:",
        err
      );

      window.alert(
        "Unable to generate the incident report PDF. Please try again."
      );
    }
  };

  /* ---------------- OTHER HELPERS ---------------- */

  const scrollByAmount = (ref, amt) => {
    if (!ref.current) return;

    ref.current.scrollBy({
      left: amt,
      behavior: "smooth",
    });
  };

  const getTranslatedStatus = (status) => {
    if (!status) return "";

    const statusMap = {
      pending: t("pending"),
      open: t("open"),
      completed: t("completed"),
      resolved: t("resolved"),
      high: t("high"),
      medium: t("medium"),
      low: t("low"),
      all: t("all"),
      "pending approval": t("pendingApproval"),
      confirmed: t("open"),
      rejected: t("reject"),
    };

    return (
      statusMap[
        String(status).toLowerCase()
      ] || status
    );
  };

  const getTranslatedPriority = (
    priority
  ) => {
    if (!priority) return "";

    const priorityMap = {
      high: t("high"),
      medium: t("medium"),
      low: t("low"),
    };

    return (
      priorityMap[
        String(priority).toLowerCase()
      ] || priority
    );
  };

  const getTranslatedTabLabel = (tab) => {
    const tabMap = {
      All: t("all"),
      Pending: t("pending"),
      Open: t("open"),
      Completed: t("completed"),
    };

    return tabMap[tab] || tab;
  };

  const getTranslatedFilterLabel = (
    filter
  ) => {
    const filterMap = {
      All: t("all"),
      High: t("high"),
      Medium: t("medium"),
      Low: t("low"),
    };

    return filterMap[filter] || filter;
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="ss-page">
      <main className="ss-main">
        {/* OVERVIEW */}

        <div className="ss-overview-head">
          <div>
            <h2 className="ss-h1">
              {t("overview")}
            </h2>

            <p className="ss-overview-subtitle">
              {t("shiftsCount", {
                count: shifts.length,
              })}
            </p>
          </div>

          <button
            className="ss-primary ss-primary--wide"
            onClick={() =>
              navigate("/create-shift")
            }
            type="button"
          >
            <IconPlus className="ss-plus" />
            {t("createShift")}
          </button>
        </div>

        {/* SHIFT CARD */}

        <div className="ss-dashboard-card">
          <div className="ss-topbar">
            <div className="ss-tabs">
              {[
                "All",
                "Pending",
                "Open",
                "Completed",
              ].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`ss-tab ${
                    statusTab === tab
                      ? "is-active"
                      : ""
                  }`}
                  onClick={() =>
                    setStatusTab(tab)
                  }
                >
                  {getTranslatedTabLabel(tab)}

                  <span className="ss-tab__count">
                    {tabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>

            <div className="ss-viewtoggle">
              <button
                className={`ss-viewtoggle__btn ${
                  view === "list"
                    ? "is-active"
                    : ""
                }`}
                onClick={() =>
                  setView("list")
                }
                type="button"
                aria-label={t("listView")}
              >
                <IconList />
              </button>

              <button
                className={`ss-viewtoggle__btn ${
                  view === "grid"
                    ? "is-active"
                    : ""
                }`}
                onClick={() =>
                  setView("grid")
                }
                type="button"
                aria-label={t("gridView")}
              >
                <IconGrid />
              </button>
            </div>
          </div>

          <div className="ss-filterbar">
            <span className="ss-filterbar__label">
              {t("priority")}
            </span>

            {[
              "All",
              "High",
              "Medium",
              "Low",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                className={`ss-chip-btn ${
                  priorityFilter === chip
                    ? "is-active"
                    : ""
                }`}
                onClick={() =>
                  setPriorityFilter(chip)
                }
              >
                {getTranslatedFilterLabel(
                  chip
                )}
              </button>
            ))}
          </div>

          {view === "list" ? (
            <div className="ss-table">
              <div className="ss-table__head">
                <div>{t("shift")}</div>
                <div>{t("priority")}</div>
                <div>{t("dateTime")}</div>
                <div>{t("pay")}</div>
                <div>{t("status")}</div>
              </div>

              {loading && (
                <div className="ss-empty-state">
                  {t("loadingShifts")}
                </div>
              )}

              {error && (
                <div className="ss-empty-state ss-empty-state--error">
                  {error}
                </div>
              )}

              {!loading &&
                !error &&
                filteredShifts.length ===
                  0 && (
                  <div className="ss-empty-state">
                    {t("noShifts")}
                  </div>
                )}

              {!loading &&
                !error &&
                paginatedShifts.map(
                  (shift) => (
                    <div
                      className="ss-table__row"
                      key={shift.id}
                    >
                      <div className="ss-shift-col">
                        <div className="ss-shift-title">
                          {shift.title}
                        </div>

                        <div className="ss-shift-location">
                          {shift.location}
                        </div>
                      </div>

                      <div>
                        <span
                          className={`ss-badge ss-badge--priority-${String(
                            shift.priority
                          ).toLowerCase()}`}
                        >
                          {getTranslatedPriority(
                            shift.priority
                          )}
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

                      <div className="ss-pay-col">
                        ${shift.payRate}
                        {t("perHour")}
                      </div>

                      <div>
                        <span
                          className={`ss-badge ss-badge--status-${String(
                            shift.status.tone
                          ).toLowerCase()}`}
                        >
                          {getTranslatedStatus(
                            shift.status.text
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
            </div>
          ) : (
            <div className="ss-shifts ss-shifts--grid ss-grid-view">
              {paginatedShifts.map(
                (shift) => (
                  <div
                    className="ss-card"
                    key={shift.id}
                  >
                    <div className="ss-card__head">
                      <div className="ss-role">
                        {shift.title}
                      </div>

                      <div className="ss-rate">
                        ${shift.payRate} p/h
                      </div>
                    </div>

                    <div className="ss-meta">
                      {shift.location}
                    </div>

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
                        className={`ss-badge ss-badge--priority-${String(
                          shift.priority
                        ).toLowerCase()}`}
                      >
                        {getTranslatedPriority(
                          shift.priority
                        )}
                      </span>

                      <span
                        className={`ss-badge ss-badge--status-${String(
                          shift.status.tone
                        ).toLowerCase()}`}
                      >
                        {getTranslatedStatus(
                          shift.status.text
                        )}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <div className="ss-pagination">
            <div className="ss-pagination__meta">
              {t("showing", {
                start: showingStart,
                end: showingEnd,
                total:
                  filteredShifts.length,
              })}
            </div>

            <div className="ss-pagination__controls">
              <button
                type="button"
                className="ss-page-btn"
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.max(1, prev - 1)
                  )
                }
                aria-label={t("previous")}
              >
                ‹
              </button>

              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`ss-page-btn ${
                    currentPage === page
                      ? "is-active"
                      : ""
                  }`}
                  onClick={() =>
                    setCurrentPage(page)
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="ss-page-btn"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      totalPages,
                      prev + 1
                    )
                  )
                }
                aria-label={t("next")}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* INCIDENT REPORTS */}

        <div className="ss-section-head">
          <h2 className="ss-section-title">
            {t("incidentReportsTitle")}
          </h2>

          <p className="ss-section-subtitle">
            {t("pendingIncidents", {
              count:
                incidentSummary.pending,
              total:
                incidentSummary.total,
            })}
          </p>
        </div>

        <div className="ss-dashboard-card">
          <div className="ss-incident-toolbar">
            <input
              className="ss-incident-search"
              placeholder={t(
                "searchIncident"
              )}
              value={incidentQuery}
              onChange={(e) =>
                setIncidentQuery(
                  e.target.value
                )
              }
            />

            <select
              value={incidentStatusFilter}
              onChange={(e) =>
                setIncidentStatusFilter(
                  e.target.value
                )
              }
            >
              <option value="All">
                {t("allStatuses")}
              </option>

              <option value="Pending">
                {t("pending")}
              </option>

              <option value="Resolved">
                {t("resolved")}
              </option>
            </select>

            <select
              value={
                incidentSeverityFilter
              }
              onChange={(e) =>
                setIncidentSeverityFilter(
                  e.target.value
                )
              }
            >
              <option value="All">
                {t("allSeverities")}
              </option>

              <option value="High">
                {t("high")}
              </option>

              <option value="Medium">
                {t("medium")}
              </option>

              <option value="Low">
                {t("low")}
              </option>
            </select>

            <select
              value={incidentSort}
              onChange={(e) =>
                setIncidentSort(
                  e.target.value
                )
              }
            >
              <option value="Newest">
                {t("sortNewest")}
              </option>

              <option value="Oldest">
                {t("sortOldest")}
              </option>

              <option value="Severity">
                {t("sortSeverity")}
              </option>
            </select>

            <button
              className="ss-reset-btn"
              type="button"
              onClick={() => {
                setIncidentQuery("");
                setIncidentStatusFilter(
                  "All"
                );
                setIncidentSeverityFilter(
                  "All"
                );
                setIncidentSort("Newest");
              }}
            >
              {t("reset")}
            </button>
          </div>

          <div className="ss-incident-summary">
            <span>
              {incidentSummary.total}{" "}
              {t("total")}
            </span>

            <span>
              {incidentSummary.pending}{" "}
              {t("pending")}
            </span>

            <span>
              {incidentSummary.resolved}{" "}
              {t("resolved")}
            </span>

            <span>
              {filteredIncidents.length}{" "}
              {t("showingResults")}
            </span>
          </div>

          <div className="ss-incident-list">
            {filteredIncidents.length ===
              0 && (
              <div className="ss-empty-state">
                {t("noIncidents")}
              </div>
            )}

            {filteredIncidents.map(
              (inc) => (
                <div
                  className="ss-incident-row"
                  key={inc.id}
                >
                  <div className="ss-incident-row__line" />

                  <div className="ss-incident-avatar">
                    {safePdfValue(
                      inc.guard,
                      "?"
                    )
                      .split(" ")
                      .map(
                        (name) =>
                          name[0] || ""
                      )
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div className="ss-incident-person">
                    <div className="ss-incident-name">
                      {safePdfValue(
                        inc.guard
                      )}
                    </div>
                  </div>

                  <div className="ss-incident-shift">
                    {safePdfValue(
                      inc.shift
                    )}
                  </div>

                  <div className="ss-incident-id">
                    {safePdfValue(inc.id)}
                  </div>

                  <div className="ss-incident-date">
                    <IconCalendar className="ss-ico" />
                    {safePdfValue(
                      inc.date
                    )}
                  </div>

                  <div className="ss-incident-badges">
                    <span
                      className={`ss-badge ss-badge--priority-${String(
                        inc.severity ||
                          "medium"
                      ).toLowerCase()}`}
                    >
                      {getTranslatedPriority(
                        inc.severity
                      )}
                    </span>

                    <span
                      className={`ss-badge ss-badge--status-${
                        inc.status ===
                        "Resolved"
                          ? "completed"
                          : "pending"
                      }`}
                    >
                      {getTranslatedStatus(
                        inc.status
                      )}
                    </span>
                  </div>

                  <div className="ss-incident-actions">
                    <button
                      className="ss-download-btn"
                      type="button"
                      onClick={() =>
                        handleDownloadIncidentPdf(
                          inc
                        )
                      }
                      aria-label={`Download PDF for ${safePdfValue(
                        inc.id,
                        "incident"
                      )}`}
                    >
                      <IconDownload className="ss-download-icon" />
                      PDF
                    </button>

                    <button
                      className="ss-review-btn"
                      type="button"
                      onClick={() =>
                        openIncidentModal(
                          inc
                        )
                      }
                    >
                      {t("review")}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* REVIEWS */}

        <div className="ss-section-head ss-section-head--reviews">
          <h2 className="ss-section-title">
            {t("recentReviews")}
          </h2>

          <div className="ss-review-arrows">
            <button
              className="ss-mini-arrow"
              onClick={() =>
                scrollByAmount(
                  reviewScroller,
                  -300
                )
              }
              type="button"
              aria-label={t("previous")}
            >
              ‹
            </button>

            <button
              className="ss-mini-arrow"
              onClick={() =>
                scrollByAmount(
                  reviewScroller,
                  300
                )
              }
              type="button"
              aria-label={t("next")}
            >
              ›
            </button>
          </div>
        </div>

        <div className="ss-dashboard-card ss-dashboard-card--reviews">
          <div
            ref={reviewScroller}
            className="ss-reviews__track"
          >
            {reviews.map((r, i) => (
              <div
                key={i}
                className="ss-reviewcard"
              >
                <div className="ss-reviewcard__top">
                  <div className="ss-avatar ss-avatar--lg">
                    <IconUser />
                  </div>

                  <div>
                    <div className="ss-review__name">
                      {r.name}
                    </div>

                    <div className="ss-review__role">
                      {r.role}
                    </div>
                  </div>
                </div>

                <div className="ss-review__stars">
                  {[0, 1, 2, 3, 4].map(
                    (k) => (
                      <Star
                        key={k}
                        filled={
                          k < r.stars
                        }
                      />
                    )
                  )}
                </div>

                <p className="ss-review__text">
                  “{r.text}”
                </p>

                <div className="ss-review__date">
                  {r.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* INCIDENT MODAL */}

      {selectedIncident && (
        <div
          className="create-shift-modal-backdrop"
          onClick={() =>
            setSelectedIncident(null)
          }
        >
          <div
            className="create-shift-card"
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              maxWidth: "700px",
            }}
          >
            <div className="create-shift-header">
              <div>
                <h1>
                  {t("incidentDetails")} (
                  <span className="ss-incident-id">
                    {safePdfValue(
                      selectedIncident.id
                    )}
                  </span>
                  )
                </h1>

                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  {t("recordedOn", {
                    date:
                      selectedIncident.date ||
                      "--",
                    time:
                      selectedIncident.time ||
                      "--",
                  })}
                </p>
              </div>

              <span
                className={`ss-badge ss-badge--status-${
                  selectedIncident.status ===
                  "Resolved"
                    ? "completed"
                    : "pending"
                }`}
              >
                {getTranslatedStatus(
                  selectedIncident.status
                )}
              </span>
            </div>

            <div
              className="form-grid"
              style={{
                marginBottom: "20px",
              }}
            >
              <div className="form-group">
                <label>
                  {t("reportedBy")}
                </label>

                <div
                  className="ss-input-static"
                  style={{
                    padding: "10px",
                    borderRadius: "4px",
                  }}
                >
                  {safePdfValue(
                    selectedIncident.guard
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>
                  {t("assignSeverity")}
                </label>

                <select
                  value={
                    incidentDraft.severity
                  }
                  onChange={(e) =>
                    setIncidentDraft(
                      (prev) => ({
                        ...prev,
                        severity:
                          e.target.value,
                      })
                    )
                  }
                  style={{
                    padding: "10px",
                    border:
                      "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="Low">
                    {t("low")}
                  </option>

                  <option value="Medium">
                    {t("medium")}
                  </option>

                  <option value="High">
                    {t("high")}
                  </option>
                </select>
              </div>
            </div>

            <div
              className="form-group"
              style={{
                marginBottom: "20px",
              }}
            >
              <label>
                {t("guardsDescription")}
              </label>

              <div className="ss-incident-description">
                {safePdfValue(
                  selectedIncident.description
                )}
              </div>
            </div>

            <div
              className="form-group"
              style={{
                marginBottom: "20px",
              }}
            >
              <label>
                {t("evidencePhotos")}
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                {(
                  selectedIncident.photos ||
                  []
                ).map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={t(
                      "evidencePhotos"
                    )}
                    className="ss-evidence-img"
                  />
                ))}

                {(!selectedIncident.photos ||
                  selectedIncident.photos
                    .length === 0) && (
                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                    }}
                  >
                    {t("noPhotos")}
                  </p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>
                {t("employerComments")}
              </label>

              <textarea
                placeholder={t("addNotes")}
                value={
                  incidentDraft.comments
                }
                onChange={(e) =>
                  setIncidentDraft(
                    (prev) => ({
                      ...prev,
                      comments:
                        e.target.value,
                    })
                  )
                }
                style={{
                  border:
                    "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "10px",
                }}
                rows={4}
              />
            </div>

            <div
              className="actions"
              style={{
                marginTop: "30px",
              }}
            >
              <button
                className="pdf-modal-btn"
                type="button"
                onClick={() =>
                  handleDownloadIncidentPdf(
                    {
                      ...selectedIncident,
                      severity:
                        incidentDraft.severity,
                      comments:
                        incidentDraft.comments,
                    }
                  )
                }
              >
                <IconDownload className="ss-download-icon" />
                Download PDF
              </button>

              <button
                className="primary"
                type="button"
                onClick={() =>
                  updateIncident(
                    selectedIncident.id,
                    "Resolved",
                    incidentDraft.severity,
                    incidentDraft.comments
                  )
                }
              >
                {t("markResolved")}
              </button>

              <button
                className="secondary"
                type="button"
                onClick={() =>
                  updateIncident(
                    selectedIncident.id,
                    "Pending",
                    incidentDraft.severity,
                    incidentDraft.comments
                  )
                }
              >
                {t("savePending")}
              </button>

              <button
                className="secondary"
                type="button"
                style={{
                  color: "#666",
                }}
                onClick={() =>
                  setSelectedIncident(null)
                }
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
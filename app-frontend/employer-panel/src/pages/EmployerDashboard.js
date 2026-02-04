import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import "./EmployerDashboard.css";
import CreateShift from "./createShift";

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

export default function EmployerDashboard() {
  const [view, setView] = useState("list"); // default list view
  const overviewScroller = useRef(null);
  const reviewScroller = useRef(null);
  const navigate = useNavigate();   
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchShifts() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/v1/shifts", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch shifts");
        const data = await res.json();
        // Map backend data to dashboard format
        const apiShifts = Array.isArray(data) ? data : (data.shifts || data.items || []);
        setShifts(apiShifts.map(s => ({
          role: s.title || "-",
          company: s.siteName || s.company || "-",
          venue: s.location?.street || s.venue || "-",
          rate: s.payRate || s.price || 0,
          status: mapStatus(s.status),
          date: formatDate(s.date),
          time: formatTime(s.startTime, s.endTime),
        })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchShifts();
  }, []);

  function mapStatus(status) {
    if (!status) return { text: "Open", tone: "confirmed" };
    const s = status.toLowerCase();
    if (s === "pending") return { text: "Pending", tone: "pending" };
    if (s === "rejected") return { text: "Rejected", tone: "rejected" };
    if (s === "completed") return { text: "Completed", tone: "completed" };
    if (s === "confirmed") return { text: "Confirmed", tone: "confirmed" };
    return { text: status, tone: "confirmed" };
  }
  function formatDate(date) {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d)) return date;
    return d.toLocaleDateString("en-GB");
  }
  function formatTime(start, end) {
    if (!start || !end) return "-";
    return `${to12hr(start)} - ${to12hr(end)}`;
  }
  function to12hr(t) {
    if (!t) return "-";
    let [h, m] = t.split(":");
    h = parseInt(h, 10);
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  const reviews = useMemo(() => [
    { name: "John Smith", role: "Crowd Control", stars: 5 },
    { name: "Andrew Goddard", role: "Crowd Control", stars: 4 },
    { name: "Amy Huggins", role: "Crowd Control", stars: 4 },
  ], []);

  const scrollByAmount = (ref, amt) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: amt, behavior: "smooth" });
  };

  return (
    <div className="ss-page">
  
      {/* -------- Overview -------- */}
      <main className="ss-main">
        <h2 className="ss-h1">Overview</h2>

        {/* Controls ABOVE grey grid */}
        <div className="ss-controls">
          <div className="ss-controls-right">
            <button
              className="ss-primary ss-primary--wide"
                onClick={() => setShowCreateModal(true)}
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
          <button className="ss-arrow ss-arrow--left" onClick={() => scrollByAmount(overviewScroller, -320)}>‹</button>
          <div className="ss-panel">
            <div ref={overviewScroller} className={`ss-shifts ${view === "grid" ? "ss-shifts--grid" : "ss-shifts--list"}`}>

              {/* Create Shift Card (only in grid view) */}
              {view === "grid" && (
                <div className="ss-card ss-card--create" onClick={() => navigate("/create-shift")}> 
                  <div className="ss-card__createicon"><IconPlus /></div>
                  <div className="ss-card__createtext">Create Shift</div>
                </div>
              )}
              {loading && <div>Loading shifts...</div>}
              {error && <div style={{color:'red'}}>{error}</div>}
              {!loading && !error && shifts.length === 0 && <div>No shifts found.</div>}
              {shifts.map((s, idx) =>
                view === "grid" ? (
                  <div className="ss-card" key={idx}>
                    <div className="ss-card__head">
                      <div className="ss-role">{s.role}</div>
                      <div className="ss-rate">${s.rate} p/h</div>
                    </div>
                    <div className="ss-meta">{s.company} — {s.venue}</div>
                    <div className={`ss-status ss-status--${s.status.tone}`}>Status: {s.status.text}</div>
                    <div className="ss-when">
                      <span className="ss-when__item"><IconCalendar className="ss-ico" />{s.date}</span>
                      <span className="ss-when__item"><IconClock className="ss-ico" />{s.time}</span>
                    </div>
                  </div>
                ) : (
                  <div className="ss-row" key={idx}>
                    <div className="ss-col ss-role">{s.role}</div>
                    <div className="ss-col ss-company">{s.company} — {s.venue}</div>
                    <div className="ss-col ss-rate">${s.rate} p/h</div>
                    <div className="ss-col ss-date">
                      <IconCalendar className="ss-ico" /> {s.date}
                    </div>
                    <div className="ss-col ss-time">
                      <IconClock className="ss-ico" /> {s.time}
                    </div>
                    <div className={`ss-col ss-status ss-status--${s.status.tone}`}>
                      Status: {s.status.text}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
          <button className="ss-arrow ss-arrow--right" onClick={() => scrollByAmount(overviewScroller, 320)}>›</button>
        </div>

        {/* Reviews */}
        <h2 className="ss-h1 ss-h1--spaced">Recent Review</h2>
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
      {showCreateModal && (
        <CreateShift
          isModal
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

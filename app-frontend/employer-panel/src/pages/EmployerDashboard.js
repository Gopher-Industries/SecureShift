import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "./EmployerDashboard.css";

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
  const [view, setView] = useState("list");
  const overviewScroller = useRef(null);
  const reviewScroller = useRef(null);
  const navigate = useNavigate();

  /* ---------------------------------------
     SHIFT DATA (DUMMY FOR NOW)
     --------------------------------------- */
  const shifts = useMemo(() => [
    { role: "Crowd Control", company: "AIG Solutions", venue: "Marvel Stadium", rate: 55, date: "12/12/2025", time: "5:00 PM - 1:00 AM", status: "open" },
    { role: "Shopping Centre Security", company: "Vicinity Centres", venue: "Chadstone Shopping Centre", rate: 75, date: "11/12/2025", time: "1:00 PM - 9:00 PM", status: "applied" },
    { role: "Crowd Control", company: "AIG Solutions", venue: "Marvel Stadium", rate: 55, date: "10/12/2025", time: "5:00 PM - 1:00 AM", status: "assigned" },
    { role: "Crowd Control", company: "AIG Solutions", venue: "Marvel Stadium", rate: 55, date: "08/12/2025", time: "5:00 PM - 1:00 AM", status: "completed" },
    { role: "Crowd Control", company: "AIG Solutions", venue: "Marvel Stadium", rate: 55, date: "07/12/2025", time: "5:00 PM - 1:00 AM", status: "completed" },
    { role: "New Test Shift",company: "Test Co",venue: "Test Venue",rate: 40,date: "01/01/2026",time: "5PM - 11PM",status: "applied"},
    { role: "New Test Shift",company: "Test Co",venue: "Test Venue",rate: 40,date: "01/01/2026",time: "5PM - 11PM",status: "applied"}




  ], []);

  /* ---------------------------------------
     LIVE INDICATOR COUNTS
     --------------------------------------- */
  const openCount = shifts.filter(s => s.status === "open").length;
  const appliedCount = shifts.filter(s => s.status === "applied").length;
  const assignedCount = shifts.filter(s => s.status === "assigned").length;
  const completedCount = shifts.filter(s => s.status === "completed").length;

  /* Dummy Reviews */
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
      <main className="ss-main">
        
        <h2 className="ss-h1">Overview</h2>

        {/* ---------------------------------------
            LIVE STATUS INDICATORS
        --------------------------------------- */}
        <div className="status-row">
          <div className="status-card open">Open Shifts: {openCount}</div>
          <div className="status-card applied">Applied Shifts: {appliedCount}</div>
          <div className="status-card assigned">Assigned Shifts: {assignedCount}</div>
          <div className="status-card completed">Completed Shifts: {completedCount}</div>
        </div>

        {/* Controls ABOVE grid */}
        <div className="ss-controls">
          <div className="ss-controls-right">
            <button className="ss-primary ss-primary--wide" onClick={() => navigate("/create-shift")}>
              <IconPlus className="ss-plus" /> Create Shift
            </button>
            <div className="ss-viewtoggle">
              <button className={`ss-viewtoggle__btn ${view === "grid" ? "is-active" : ""}`} onClick={() => setView("grid")}><IconGrid /></button>
              <button className={`ss-viewtoggle__btn ${view === "list" ? "is-active" : ""}`} onClick={() => setView("list")}><IconList /></button>
            </div>
          </div>
        </div>

        {/* ---------------------------------------
            SHIFTS LIST + GRID
        --------------------------------------- */}
        <div className="ss-overview">
          <button className="ss-arrow ss-arrow--left" onClick={() => scrollByAmount(overviewScroller, -320)}>‹</button>

          <div className="ss-panel">
            <div ref={overviewScroller} className={`ss-shifts ${view === "grid" ? "ss-shifts--grid" : "ss-shifts--list"}`}>

              {/* Create Shift card (grid only) */}
              {view === "grid" && (
                <div className="ss-card ss-card--create" onClick={() => navigate("/create-shift")}>
                  <div className="ss-card__createicon"><IconPlus /></div>
                  <div className="ss-card__createtext">Create Shift</div>
                </div>
              )}

              {shifts.map((s, idx) =>
                view === "grid" ? (
                  /* ---------- GRID CARD ----------- */
                  <div className="ss-card" key={idx}>
                    <div className="ss-card__head">
                      <div className="ss-role">{s.role}</div>
                      <div className="ss-rate">${s.rate} p/h</div>
                    </div>

                    <div className="ss-meta">{s.company} — {s.venue}</div>

                    {/* FIXED STATUS HERE */}
                    <div className={`ss-status ss-status--${s.status}`}>
                      Status: {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </div>

                    <div className="ss-when">
                      <span className="ss-when__item"><IconCalendar className="ss-ico" /> {s.date}</span>
                      <span className="ss-when__item"><IconClock className="ss-ico" /> {s.time}</span>
                    </div>
                  </div>
                ) : (
                  /* ------------ LIST ROW ------------ */
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

                    {/* FIXED STATUS HERE */}
                   <div className={`status-badge badge-${s.status}`}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </div>


                  </div>
                )
              )}
            </div>
          </div>

          <button className="ss-arrow ss-arrow--right" onClick={() => scrollByAmount(overviewScroller, 320)}>›</button>
        </div>

        {/* ---------------------------------------
            REVIEWS
        --------------------------------------- */}
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
    </div>
  );
}

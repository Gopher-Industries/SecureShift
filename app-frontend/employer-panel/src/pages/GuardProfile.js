import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ❌ removed local dummy guardData

const allSkills = ["CCTV Monitoring","Crowd Control","Defensive Driving","First Aid","Gate Control","K9 Patrol","Loss Prevention","Patrolling","Perimeter Security","Surveillance","Vehicle Patrol"];
const availabilityOptions = ["Available","Unavailable","On Leave"];

// NEW: read API base from env (Vite or CRA) ---------------------------------
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
                                          // NEW

function GuardProfiles() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const cardsPerPage = 8;
  const skillsRef = useRef();
  const availabilityRef = useRef();

  // NEW: state for API data / loading / error ---------------------------------
  const [guards, setGuards] = useState([]);                           // NEW
  const [loading, setLoading] = useState(true);                        // NEW
  const [error, setError] = useState("");                              // NEW

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (skillsRef.current && !skillsRef.current.contains(event.target)) setSkillsOpen(false);
      if (availabilityRef.current && !availabilityRef.current.contains(event.target)) setAvailabilityOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // NEW: fetch guards from backend --------------------------------------------
  useEffect(() => {                                                    // NEW
    let mounted = true;                                                // NEW
    (async () => {                                                     // NEW
      try {                                                            // NEW
        setLoading(true);                                              // NEW
        setError("");                                                  // NEW

        const token = localStorage.getItem("token");                   // NEW (if you use JWT)
        const res = await fetch(`${API_BASE}/api/v1/users/guards`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`, // ✅ send token
  }
});                                            // NEW

        if (!res.ok) {                                                 // NEW
          const text = await res.text().catch(() => "");               // NEW
          throw new Error(text || `Request failed (${res.status})`);   // NEW
        }                                                              // NEW

        const data = await res.json();                                 // NEW

        // Accept both shapes: array OR {guards:[...]} ----------------- // NEW
        const list = Array.isArray(data) ? data : Array.isArray(data?.guards) ? data.guards : []; // NEW

        // Normalize fields so UI always has name/skills/availability/photo
        const normalized = list.map((g, i) => ({                       // NEW
          id: g._id || g.id || String(i),                              // NEW
          name:
            g.name ||
            [g.firstName, g.lastName].filter(Boolean).join(" ") ||
            "Unknown",                                                 // NEW
          skills: Array.isArray(g.skills)
            ? g.skills
            : typeof g.skills === "string"
            ? g.skills.split(",").map((s) => s.trim())
            : Array.isArray(g.skillset)
            ? g.skillset
            : [],                                                      // NEW
          availability:
            g.availability ?? g.status ?? (g.available ? "Available" : "Unavailable"), // NEW
          photo: g.photo?.url || g.photo || g.avatar || g.imageUrl || "/GuardPicPlaceholder.png", // NEW
        }));                                                           // NEW

        if (mounted) setGuards(normalized);                            // NEW
      } catch (e) {                                                    // NEW
        if (mounted) setError(e.message || "Failed to fetch guards");  // NEW
      } finally {                                                      // NEW
        if (mounted) setLoading(false);                                // NEW
      }                                                                // NEW
    })();                                                              // NEW
    return () => { mounted = false; };                                 // NEW
  }, []);                                                              // NEW

  const toggleSkill = (skill) => setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  const toggleAvailability = (avail) => setSelectedAvailability(prev => prev.includes(avail) ? prev.filter(a => a !== avail) : [...prev, avail]);

  // UPDATED: filter the fetched guards (not the old dummy array) --------------
  const filteredGuards = guards.filter(guard =>                       // UPDATED
    (selectedSkills.length === 0 || selectedSkills.every(skill => (guard.skills || []).includes(skill))) &&
    (selectedAvailability.length === 0 || selectedAvailability.includes(guard.availability))
  );                                                                  // UPDATED

  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredGuards.slice(indexOfFirstCard, indexOfLastCard);
  const totalPages = Math.max(1, Math.ceil(filteredGuards.length / cardsPerPage)); // small safety

  // ===== Inline Styles =====
  const pageStyle = { display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#fafafa" };
  const contentStyle = { flex: 1, padding: "1rem" };
  const filtersStyle = { display: "flex", justifyContent: "center", gap: "1rem", margin: "1rem 0" };
  const dropdownStyle = { position: "relative", display: "inline-block" };
  
  const dropdownButtonStyle = (open = false, selectedCount = 0) => ({
    padding: "8px 16px",
    borderRadius: "9999px",
    border: "none",
    backgroundColor: open || selectedCount > 0 ? "#ababab" : "#274b93",
    color: "#fff",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 500,
    fontSize: "16px",
    cursor: "pointer",
    minWidth: "180px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "background 0.2s ease"
  });

  const dropdownContentStyle = {
    position: "absolute",
    top: "110%",
    left: 0,
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "12px",
    padding: "0.5rem 1rem",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    zIndex: 10,
    maxHeight: "250px",
    overflowY: "auto",
    whiteSpace: "nowrap",
    width: "max-content",
    minWidth: "180px"
  };

  const dropdownLabelStyle = { display: "flex", alignItems: "center", gap: "8px", fontFamily: "Poppins, sans-serif", fontSize: "16px", fontWeight: 500, marginBottom: "6px", cursor: "pointer" };
  const checkboxStyle = { width: "18px", height: "18px", accentColor: "#274b93", cursor: "pointer" };
  const guardContainerStyle = { display: "flex", flexWrap: "wrap", justifyContent: "center", padding: "2rem", gap: "1rem" };
  const guardCardStyle = { border: "1px solid #e0e0e0", borderRadius: "12px", padding: "20px 24px", backgroundColor: "#ababab", boxShadow: "0 2px 6px rgba(0,0,0,0.08)", textAlign: "center", fontFamily: "Poppins, sans-serif", flex: "0 0 calc(25% - 1rem)", boxSizing: "border-box" };
  const guardImageStyle = { borderRadius: "50%", width: "100px", height: "100px", marginBottom: "1rem", objectFit: "cover" }; // tiny improvement
  const backButtonStyle = { display: "block", margin: "2rem auto", padding: "12px 32px", border: "none", borderRadius: "9999px", backgroundColor: "#274b93", color: "#fff", fontSize: "16px", fontWeight: 500, cursor: "pointer", transition: "background 0.2s ease", textAlign: "center" };
  const paginationStyle = { textAlign: "center", margin: "1rem 0" };
  const paginationButtonStyle = (active = false) => ({ margin: "0 4px", padding: "8px 12px", borderRadius: "12px", border: "none", backgroundColor: active ? "#ababab" : "#274b93", color: active ? "#000" : "#fff", fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: "16px", cursor: "pointer", transition: "background 0.2s ease" });

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <h2 style={{ textAlign: "center", marginTop: "1rem" }}>Guard Profiles</h2>

        {/* NEW: loading / error / empty states */}
        {loading && <p style={{ textAlign: "center" }}>Loading guards…</p>}                  {/* NEW */}
        {!loading && error && (                                                                /* NEW */
          <p style={{ textAlign: "center", color: "#b00020" }}>Failed to load: {error}</p>    /* NEW */
        )}                                                                                    
        {!loading && !error && guards.length === 0 && (                                        /* NEW */
          <p style={{ textAlign: "center" }}>No guards found.</p>                             /* NEW */
        )}                                                                                    

        {/* Filters */}
        <div style={filtersStyle}>
          <div style={dropdownStyle} ref={skillsRef}>
            <button style={dropdownButtonStyle(skillsOpen, selectedSkills.length)} onClick={() => setSkillsOpen(!skillsOpen)}>
              Filter by Skills {selectedSkills.length > 0 ? `(${selectedSkills.length})` : ""}
              <span style={{ marginLeft: "8px" }}>▼</span>
            </button>
            {skillsOpen && (
              <div style={dropdownContentStyle}>
                {allSkills.map(skill => (
                  <label key={skill} style={dropdownLabelStyle}>
                    <input type="checkbox" checked={selectedSkills.includes(skill)} onChange={() => toggleSkill(skill)} style={checkboxStyle} />
                    {skill}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={dropdownStyle} ref={availabilityRef}>
            <button style={dropdownButtonStyle(availabilityOpen, selectedAvailability.length)} onClick={() => setAvailabilityOpen(!availabilityOpen)}>
              Filter by Availability {selectedAvailability.length > 0 ? `(${selectedAvailability.length})` : ""}
              <span style={{ marginLeft: "8px" }}>▼</span>
            </button>
            {availabilityOpen && (
              <div style={dropdownContentStyle}>
                {availabilityOptions.map(avail => (
                  <label key={avail} style={dropdownLabelStyle}>
                    <input type="checkbox" checked={selectedAvailability.includes(avail)} onChange={() => toggleAvailability(avail)} style={checkboxStyle} />
                    {avail}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Guard Cards */}
        <div style={guardContainerStyle}>
          {currentCards.map(guard => (
            <div key={guard.id} style={guardCardStyle}>
              <img src={guard.photo} alt={guard.name} style={guardImageStyle} />
              <h3>{guard.name}</h3>
              <p><strong>Skills:</strong> {(guard.skills || []).join(", ")}</p>
              <p><strong>Availability:</strong> {guard.availability}</p>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div style={paginationStyle}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i + 1} style={paginationButtonStyle(currentPage === i + 1)} onClick={() => setCurrentPage(i + 1)}>
              {i + 1}
            </button>
          ))}
        </div>

        {/* Back Button */}
        <button
          style={backButtonStyle}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#ababab"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#274b93"}
          onClick={() => navigate("/employer-dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default GuardProfiles;

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const guardData = [
  { id: 1, name: "John Smith", skills: ["Patrolling", "Surveillance"], availability: "Available", photo: "/GuardPicPlaceholder.png" },
  { id: 2, name: "Jane Sebastian", skills: ["First Aid", "Crowd Control"], availability: "On Leave", photo: "/GuardPicPlaceholder.png" },
  { id: 3, name: "Mike Goel", skills: ["CCTV Monitoring", "Gate Control"], availability: "Available", photo: "/GuardPicPlaceholder.png" },
  { id: 4, name: "Alice Brown", skills: ["K9 Patrol", "Perimeter Security"], availability: "Available", photo: "/GuardPicPlaceholder.png" },
  { id: 5, name: "Bob Johnson", skills: ["Loss Prevention", "Defensive Driving"], availability: "Unavailable", photo: "/GuardPicPlaceholder.png" },
  { id: 6, name: "Clara Lee", skills: ["Vehicle Patrol", "Surveillance"], availability: "Available", photo: "/GuardPicPlaceholder.png" },
  { id: 7, name: "David Kim", skills: ["Crowd Control", "First Aid"], availability: "On Leave", photo: "/GuardPicPlaceholder.png" },
  { id: 8, name: "Eva Green", skills: ["Gate Control", "CCTV Monitoring"], availability: "Available", photo: "/GuardPicPlaceholder.png" },
  { id: 9, name: "Frank White", skills: ["Patrolling", "Loss Prevention"], availability: "Unavailable", photo: "/GuardPicPlaceholder.png" },
  { id: 10, name: "Grace Taylor", skills: ["K9 Patrol", "Vehicle Patrol"], availability: "Available", photo: "/GuardPicPlaceholder.png" },
  { id: 11, name: "Henry Adams", skills: ["Defensive Driving", "Surveillance"], availability: "Available", photo: "/GuardPicPlaceholder.png" },
  { id: 12, name: "Isla Martinez", skills: ["Crowd Control", "Gate Control"], availability: "On Leave", photo: "/GuardPicPlaceholder.png" }
];

const allSkills = ["CCTV Monitoring","Crowd Control","Defensive Driving","First Aid","Gate Control","K9 Patrol","Loss Prevention","Patrolling","Perimeter Security","Surveillance","Vehicle Patrol"];
const availabilityOptions = ["Available","Unavailable","On Leave"];

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (skillsRef.current && !skillsRef.current.contains(event.target)) setSkillsOpen(false);
      if (availabilityRef.current && !availabilityRef.current.contains(event.target)) setAvailabilityOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSkill = (skill) => setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  const toggleAvailability = (avail) => setSelectedAvailability(prev => prev.includes(avail) ? prev.filter(a => a !== avail) : [...prev, avail]);

  const filteredGuards = guardData.filter(guard => 
    (selectedSkills.length === 0 || selectedSkills.every(skill => guard.skills.includes(skill))) &&
    (selectedAvailability.length === 0 || selectedAvailability.includes(guard.availability))
  );

  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredGuards.slice(indexOfFirstCard, indexOfLastCard);
  const totalPages = Math.ceil(filteredGuards.length / cardsPerPage);

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
  const guardImageStyle = { borderRadius: "50%", width: "100px", height: "100px", marginBottom: "1rem" };
  const backButtonStyle = { display: "block", margin: "2rem auto", padding: "12px 32px", border: "none", borderRadius: "9999px", backgroundColor: "#274b93", color: "#fff", fontSize: "16px", fontWeight: 500, cursor: "pointer", transition: "background 0.2s ease", textAlign: "center" };
  const paginationStyle = { textAlign: "center", margin: "1rem 0" };
  const paginationButtonStyle = (active = false) => ({ margin: "0 4px", padding: "8px 12px", borderRadius: "12px", border: "none", backgroundColor: active ? "#ababab" : "#274b93", color: active ? "#000" : "#fff", fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: "16px", cursor: "pointer", transition: "background 0.2s ease" });

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <h2 style={{ textAlign: "center", marginTop: "1rem" }}>Guard Profiles</h2>

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
              <p><strong>Skills:</strong> {guard.skills.join(", ")}</p>
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
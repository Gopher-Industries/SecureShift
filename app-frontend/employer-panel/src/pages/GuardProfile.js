import React from 'react';

const guardData = [
  {
    id: 1,
    name: "John Smith",
    skills: ["Patrolling", "Surveillance"],
    availability: "Available",
    photo: "https://via.placeholder.com/150"
  },
  {
    id: 2,
    name: "Jane Sebastian",
    skills: ["First Aid", "Crowd Control"],
    availability: "On Leave",
    photo: "https://via.placeholder.com/150"
  },
  {
    id: 3,
    name: "Mike Goel",
    skills: ["CCTV Monitoring", "Gate Control"],
    availability: "Available",
    photo: "https://via.placeholder.com/150"
  }
];

const cardStyle = {
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "1rem",
  margin: "1rem",
  width: "250px",
  textAlign: "center",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
};

const containerStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  padding: "2rem"
};

function GuardProfiles() {
  return (
    <div>
      <h2 style={{ textAlign: 'center', marginTop: '1rem' }}>Guard Profiles</h2>
      <div style={containerStyle}>
        {guardData.map(guard => (
          <div key={guard.id} style={cardStyle}>
            <img src={guard.photo} alt={guard.name} style={{ borderRadius: '50%', width: '100px', height: '100px' }} />
            <h3>{guard.name}</h3>
            <p><strong>Skills:</strong> {guard.skills.join(', ')}</p>
            <p><strong>Availability:</strong> {guard.availability}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GuardProfiles;

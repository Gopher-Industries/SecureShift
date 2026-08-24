import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import translations from '../i18n/translations';
import http from '../lib/http';
import './GuardProfile.css';

const allSkills = [
  'CCTV Monitoring',
  'Crowd Control',
  'Defensive Driving',
  'First Aid',
  'Gate Control',
  'K9 Patrol',
  'Loss Prevention',
  'Patrolling',
  'Perimeter Security',
  'Surveillance',
  'Vehicle Patrol',
];

const availabilityOptions = ['Available', 'Unavailable', 'On Leave'];

export default function GuardProfiles({ language }) {
  const t = translations[language || 'en'] || translations.en;
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const cardsPerPage = 8;
  const skillsRef = useRef();
  const availabilityRef = useRef();

  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (skillsRef.current && !skillsRef.current.contains(event.target)) setSkillsOpen(false);
      if (availabilityRef.current && !availabilityRef.current.contains(event.target))
        setAvailabilityOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');

        const res = await http.get('/users/guards');
        const data = res.data;

        const list = Array.isArray(data) ? data : Array.isArray(data?.guards) ? data.guards : [];

        const normalized = list.map((g, i) => ({
          id: g._id || g.id || String(i),
          name: g.name || [g.firstName, g.lastName].filter(Boolean).join(' ') || 'Unknown',
          skills: Array.isArray(g.skills)
            ? g.skills
            : typeof g.skills === 'string'
              ? g.skills.split(',').map((s) => s.trim())
              : Array.isArray(g.skillset)
                ? g.skillset
                : [],
          availability: g.availability ?? g.status ?? (g.available ? 'Available' : 'Unavailable'),
          photo: g.photo?.url || g.photo || g.avatar || g.imageUrl || '/GuardPicPlaceholder.png',
        }));

        if (mounted) setGuards(normalized);
      } catch (e) {
        if (mounted) setError(e.response?.data?.message || e.message || 'Failed to fetch guards');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleSkill = (skill) =>
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );

  const toggleAvailability = (avail) =>
    setSelectedAvailability((prev) =>
      prev.includes(avail) ? prev.filter((a) => a !== avail) : [...prev, avail]
    );

  const filteredGuards = guards.filter(
    (guard) =>
      (selectedSkills.length === 0 ||
        selectedSkills.every((skill) => (guard.skills || []).includes(skill))) &&
      (selectedAvailability.length === 0 || selectedAvailability.includes(guard.availability))
  );

  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredGuards.slice(indexOfFirstCard, indexOfLastCard);
  const totalPages = Math.max(1, Math.ceil(filteredGuards.length / cardsPerPage));

  return (
    <div className="gp-page">
      <div className="gp-content">
        <h2 className="gp-title">{t.guardProfiles}</h2>

        {loading && <p className="gp-status-msg">Loading guards…</p>}
        {!loading && error && <p className="gp-status-msg error">Failed to load: {error}</p>}
        {!loading && !error && guards.length === 0 && (
          <p className="gp-status-msg">No guards found.</p>
        )}

        {/* Filters */}
        <div className="gp-filters">
          <div className="gp-dropdown" ref={skillsRef}>
            <button
              className={`gp-dropdown-btn ${skillsOpen || selectedSkills.length > 0 ? 'active' : ''}`}
              onClick={() => setSkillsOpen(!skillsOpen)}
            >
              Filter by Skills {selectedSkills.length > 0 ? `(${selectedSkills.length})` : ''}
              <span>▼</span>
            </button>
            {skillsOpen && (
              <div className="gp-dropdown-menu">
                {allSkills.map((skill) => (
                  <label key={skill} className="gp-dropdown-label">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="gp-checkbox"
                    />
                    {skill}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="gp-dropdown" ref={availabilityRef}>
            <button
              className={`gp-dropdown-btn ${
                availabilityOpen || selectedAvailability.length > 0 ? 'active' : ''
              }`}
              onClick={() => setAvailabilityOpen(!availabilityOpen)}
            >
              Filter by Availability{' '}
              {selectedAvailability.length > 0 ? `(${selectedAvailability.length})` : ''}
              <span>▼</span>
            </button>
            {availabilityOpen && (
              <div className="gp-dropdown-menu">
                {availabilityOptions.map((avail) => (
                  <label key={avail} className="gp-dropdown-label">
                    <input
                      type="checkbox"
                      checked={selectedAvailability.includes(avail)}
                      onChange={() => toggleAvailability(avail)}
                      className="gp-checkbox"
                    />
                    {avail}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Guard Cards */}
        <div className="gp-card-container">
          {currentCards.map((guard) => (
            <div key={guard.id} className="gp-card">
              <img src={guard.photo} alt={guard.name} className="gp-card-img" />
              <h3>{guard.name}</h3>
              <p>
                <strong>Skills:</strong> {(guard.skills || []).join(', ')}
              </p>
              <p>
                <strong>Availability:</strong> {guard.availability}
              </p>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="gp-pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`gp-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Back Button */}
        <button className="gp-back-btn" onClick={() => navigate('/employer-dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

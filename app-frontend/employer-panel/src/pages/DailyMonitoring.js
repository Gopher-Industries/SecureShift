import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DailyMonitoring.css';

const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
  </svg>
);

const IconMoney = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconClockIn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);

const IconClockOut = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconCompleted = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconLate = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconAbsent = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e02424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const activityConfig = {
  clockin:   { icon: <IconClockIn />,   color: '#16a34a' },
  clockout:  { icon: <IconClockOut />,  color: '#64748b' },
  completed: { icon: <IconCompleted />, color: '#64748b' },
  late:      { icon: <IconLate />,      color: '#d97706' },
  absent:    { icon: <IconAbsent />,    color: '#e02424' },
};

const guards = [
  {
    id: 1, name: 'Emily Watson', site: 'Chadstone', status: 'Completed', initials: 'EW',
    clockIn: '08:00:42', clockOut: '12:23:00', duration: '4h 23m', date: '22-04-2026', payRate: '45/hr',
    activities: [
      { type: 'clockout', label: 'Clocked Out', time: '12:23:00' },
      { type: 'completed', label: 'Shift Completed', time: '12:23:00' },
      { type: 'clockin', label: 'Clocked In', time: '08:00:42' },
    ],
    checkpoints: [
      { name: 'Main Entrance', site: 'Chadstone', time: '11:55:02', note: 'Second pass – all secure' },
      { name: 'Parking Lot', site: 'Chadstone', time: '12:00:00', note: 'Vehicle parked in restricted zone — license plate noted, security cone placed.', issue: true },
      { name: 'Main Entrance', site: 'Chadstone', time: '08:30:00', note: 'First pass – all secure' },
    ],
  },
  {
    id: 2, name: 'David Kim', site: 'Eastland', status: 'On Shift', initials: 'DK',
    clockIn: '09:00:00', clockOut: null, duration: '3h 10m', date: '22-04-2026', payRate: '42/hr',
    activities: [
      { type: 'clockin', label: 'Clocked In', time: '09:00:00' },
    ],
    checkpoints: [
      { name: 'Reception Desk', site: 'Eastland', time: '10:15:00', note: 'All clear' },
    ],
  },
  {
    id: 3, name: 'Lisa Patel', site: 'Burwood One', status: 'Absent', initials: 'LP',
    clockIn: null, clockOut: null, duration: '—', date: '22-04-2026', payRate: '40/hr',
    activities: [
      { type: 'absent', label: 'Absent', time: '08:30:00', note: 'Did not report for scheduled shift' },
    ],
    checkpoints: [],
  },
  {
    id: 4, name: 'Ana Garcia', site: 'Chadstone', status: 'Late', initials: 'AG',
    clockIn: '09:45:00', clockOut: null, duration: '2h 30m', date: '22-04-2026', payRate: '43/hr',
    activities: [
      { type: 'late', label: 'Late Arrival', time: '09:45:00', note: 'Arrived 45 min late — traffic delay' },
      { type: 'clockin', label: 'Clocked In', time: '09:45:00' },
    ],
    checkpoints: [],
  },
  {
    id: 5, name: 'James Nguyen', site: 'Marvel Stadium', status: 'Completed', initials: 'JN',
    clockIn: '07:00:00', clockOut: '15:00:00', duration: '8h 00m', date: '22-04-2026', payRate: '48/hr',
    activities: [
      { type: 'clockout', label: 'Clocked Out', time: '15:00:00' },
      { type: 'completed', label: 'Shift Completed', time: '15:00:00' },
      { type: 'clockin', label: 'Clocked In', time: '07:00:00' },
    ],
    checkpoints: [
      { name: 'Gate A', site: 'Marvel Stadium', time: '09:00:00', note: 'Crowd control check – all good' },
      { name: 'VIP Entrance', site: 'Marvel Stadium', time: '11:30:00', note: 'Unauthorised individual attempted entry — escorted off premises.', issue: true },
    ],
  },
  {
    id: 6, name: 'Sophie Tran', site: 'AIG Solutions HQ', status: 'On Shift', initials: 'ST',
    clockIn: '08:30:00', clockOut: null, duration: '4h 45m', date: '22-04-2026', payRate: '41/hr',
    activities: [
      { type: 'clockin', label: 'Clocked In', time: '08:30:00' },
    ],
    checkpoints: [
      { name: 'Server Room', site: 'AIG Solutions HQ', time: '10:00:00', note: 'Door secured' },
      { name: 'Reception', site: 'AIG Solutions HQ', time: '12:00:00', note: 'All clear' },
    ],
  },
  {
    id: 7, name: 'Marcus Hill', site: 'Eastland', status: 'Late', initials: 'MH',
    clockIn: '10:15:00', clockOut: null, duration: '1h 30m', date: '22-04-2026', payRate: '40/hr',
    activities: [
      { type: 'late', label: 'Late Arrival', time: '10:15:00', note: 'Arrived 75 min late — car trouble' },
      { type: 'clockin', label: 'Clocked In', time: '10:15:00' },
    ],
    checkpoints: [],
  },
  {
    id: 8, name: 'Rachel Brooks', site: 'Burwood One', status: 'Completed', initials: 'RB',
    clockIn: '06:00:00', clockOut: '14:00:00', duration: '8h 00m', date: '22-04-2026', payRate: '44/hr',
    activities: [
      { type: 'clockout', label: 'Clocked Out', time: '14:00:00' },
      { type: 'completed', label: 'Shift Completed', time: '14:00:00' },
      { type: 'clockin', label: 'Clocked In', time: '06:00:00' },
    ],
    checkpoints: [
      { name: 'Loading Dock', site: 'Burwood One', time: '07:00:00', note: 'Morning inspection complete' },
      { name: 'Car Park Level 2', site: 'Burwood One', time: '10:30:00', note: 'No incidents' },
    ],
  },
  {
    id: 9, name: 'Kevin Osei', site: 'Marvel Stadium', status: 'Absent', initials: 'KO',
    clockIn: null, clockOut: null, duration: '—', date: '22-04-2026', payRate: '46/hr',
    activities: [
      { type: 'absent', label: 'Absent', time: '07:00:00', note: 'Did not report for scheduled shift' },
    ],
    checkpoints: [],
  },
  {
    id: 10, name: 'Priya Sharma', site: 'AIG Solutions HQ', status: 'On Shift', initials: 'PS',
    clockIn: '09:15:00', clockOut: null, duration: '4h 00m', date: '22-04-2026', payRate: '43/hr',
    activities: [
      { type: 'clockin', label: 'Clocked In', time: '09:15:00' },
    ],
    checkpoints: [
      { name: 'Main Lobby', site: 'AIG Solutions HQ', time: '11:00:00', note: 'Visitor log checked' },
    ],
  },
];

const statusColor = { 'On Shift': '#1a56db', Completed: '#057a55', Absent: '#e02424', Late: '#d97706' };
const statusBg = { 'On Shift': '#e1effe', Completed: '#def7ec', Absent: '#fde8e8', Late: '#fef3c7' };

const filters = ['All', 'On Shift', 'Late', 'Absent', 'Completed'];

export default function DailyMonitoring() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(guards[0]);

  const filtered = guards.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.site.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || g.status === filter;

    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: 'Total Guards', value: guards.length, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { label: 'On Shift', value: guards.filter((g) => g.status === 'On Shift').length, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: 'Late', value: guards.filter((g) => g.status === 'Late').length, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
    { label: 'Absent', value: guards.filter((g) => g.status === 'Absent').length, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e02424" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ];

  return (
    <div className="dm-shell">
      <h1 className="dm-heading">Daily Activity Monitoring</h1>

      <div className="dm-stats">
        {stats.map((s) => (
          <div key={s.label} className="dm-stat-card">
            <div>
              <p className="dm-stat-label">{s.label}</p>
              <p className="dm-stat-value">{s.value}</p>
            </div>
            <span className="dm-stat-icon">{s.icon}</span>
          </div>
        ))}
      </div>

      <div className="dm-body">
        <div className="dm-left">
          <input
            className="dm-search"
            placeholder="Search guard or site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="dm-filters">
            {filters.map((f) => (
              <button
                key={f}
                className={`dm-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="dm-guard-list">
            {filtered.map((g) => (
              <div
                key={g.id}
                className={`dm-guard-row ${selected?.id === g.id ? 'selected' : ''}`}
                onClick={() => setSelected(g)}
              >
                <div className="dm-avatar">{g.initials}</div>
                <div className="dm-guard-info">
                  <span className="dm-guard-name">{g.name}</span>
                  <span className="dm-guard-site"><IconLocation /> {g.site}</span>
                </div>
                <span
                  className="dm-badge"
                  style={{ color: statusColor[g.status], background: statusBg[g.status] }}
                >
                  {g.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div className="dm-right">
            <div className="dm-detail-header">
              <div className="dm-detail-avatar">{selected.initials}</div>
              <div className="dm-detail-info">
                <div className="dm-detail-name-row">
                  <h2 className="dm-detail-name">{selected.name}</h2>
                  <span
                    className="dm-badge"
                    style={{ color: statusColor[selected.status], background: statusBg[selected.status] }}
                  >
                    {selected.status}
                  </span>
                </div>
                <p className="dm-detail-meta">
                  <IconLocation /> {selected.site} &nbsp;·&nbsp; <IconCalendar /> {selected.date} &nbsp;·&nbsp; <IconMoney /> {selected.payRate}
                </p>
              </div>
              <button className="dm-contact-btn"><IconPhone /> Contact</button>
            </div>

            <div className="dm-times">
              <div className="dm-time-block">
                <p className="dm-time-label">CLOCK IN</p>
                <p className="dm-time-value">{selected.clockIn || '—'}</p>
              </div>
              <div className="dm-time-block">
                <p className="dm-time-label">CLOCK OUT</p>
                <p className="dm-time-value">{selected.clockOut || '—'}</p>
              </div>
              <div className="dm-time-block">
                <p className="dm-time-label">DURATION</p>
                <p className="dm-time-value">{selected.duration}</p>
              </div>
            </div>

            <div className="dm-section">
              <div className="dm-section-header">
                <span className="dm-section-title">Today's Activity</span>
                <span className="dm-section-count">{selected.activities.length} {selected.activities.length === 1 ? 'event' : 'events'}</span>
              </div>
              {selected.activities.length > 0 ? (
                <div className="dm-activity-list">
                  {selected.activities.map((a, i) => {
                    const cfg = activityConfig[a.type] || activityConfig.clockin;
                    return (
                      <div key={i} className="dm-activity-row">
                        <div className="dm-activity-icon-wrap">{cfg.icon}</div>
                        <div className="dm-activity-body">
                          <span className="dm-activity-label" style={{ color: cfg.color }}>{a.label}</span>
                          {a.note && <span className="dm-activity-note">"{a.note}"</span>}
                        </div>
                        <span className="dm-activity-time">{a.time}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="dm-empty">No activity recorded.</p>
              )}
            </div>

            <div className="dm-section">
              <div className="dm-section-header">
                <span className="dm-section-title">Patrol Checkpoints</span>
                <span className="dm-section-count">{selected.checkpoints.length} entries</span>
              </div>
              <p className="dm-section-sub">Checkpoint entries, notes and timestamps logged in the field</p>
              {selected.checkpoints.length > 0 ? (
                selected.checkpoints.map((cp, i) => (
                  <div key={i} className="dm-checkpoint" style={cp.issue ? { border: '1px solid #f59e0b', background: '#fffbeb' } : {}}>
                    <div className="dm-checkpoint-header">
                      <span className="dm-checkpoint-check">
                        {cp.issue ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" fill="#fef3c7" stroke="#f59e0b"/>
                            <line x1="12" y1="8" x2="12" y2="12" stroke="#f59e0b"/>
                            <circle cx="12" cy="16" r="0.5" fill="#f59e0b" stroke="#f59e0b"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" fill="#dcfce7" stroke="#16a34a"/>
                            <polyline points="9 12 11 14 15 10"/>
                          </svg>
                        )}
                      </span>
                      <span className="dm-checkpoint-name">{cp.name}</span>
                      <span className="dm-checkpoint-site-tag">{cp.site}</span>
                      <span className="dm-checkpoint-time"><IconClock /> {cp.time}</span>
                    </div>
                    <p className="dm-checkpoint-note">"{cp.note}"</p>
                  </div>
                ))
              ) : (
                <p className="dm-empty">No checkpoint entries.</p>
              )}
            </div>

          </div>
        )}
      </div>

      <button className="dm-back-btn" onClick={() => navigate('/employer-dashboard')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to Dashboard
      </button>
    </div>
  );
}

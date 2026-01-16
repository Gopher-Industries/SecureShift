import React, { useState } from 'react';
import './TaskDetail.css';

const IconClock = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconUser = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 20c0-4.4183 3.5817-8 8-8s8 3.5817 8 8" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const IconTag = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
  </svg>
);

const IconCalendar = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const IconRepeat = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M17 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 23l-4-4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconChevronDown = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function TaskDetail() {
  const [tags, setTags] = useState(['UI/UX', 'Backend', 'Frontend']);
  const [showNotesOnCard, setShowNotesOnCard] = useState(true);
  const [bucket, setBucket] = useState('Frontend Employer Panel');
  const [startDate, setStartDate] = useState('Start anytime');
  const [progress, setProgress] = useState('Not started');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('12/12/2025');
  const [repeat, setRepeat] = useState('Does not repeat');

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getTagColor = (tag) => {
    if (tag === 'UI/UX') return '#ff6b9d';
    if (tag === 'Backend') return '#4ade80';
    if (tag === 'Frontend') return '#60a5fa';
    return '#9ca3af';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'High') return '#ef4444';
    if (priority === 'Medium') return '#4ade80';
    if (priority === 'Low') return '#fbbf24';
    return '#9ca3af';
  };

  return (
    <div className="task-detail-page">
      <div className="task-detail-container">
        <div className="task-header">
          <div className="task-title-section">
            <IconClock className="task-icon" />
            <div>
              <h1 className="task-title">Implement Shift Editing System</h1>
              <div className="task-assignee">
                <IconUser className="assignee-icon" />
                <div className="assignee-avatar">GS</div>
                <span className="assignee-name">GOVARDHANAN BHARATHVASAN SATHIYANARAYANAN</span>
              </div>
            </div>
          </div>
        </div>

        <div className="task-tags-section">
          <IconTag className="tags-icon" />
          <div className="tags-container">
            {tags.map((tag, index) => (
              <div key={index} className="tag" style={{ backgroundColor: getTagColor(tag) }}>
                <span>{tag}</span>
                <button className="tag-remove" onClick={() => removeTag(tag)}>×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="task-properties">
          <div className="properties-column">
            <div className="property-field">
              <label className="property-label">Bucket</label>
              <div className="property-input">
                <span>{bucket}</span>
                <IconChevronDown className="dropdown-icon" />
              </div>
            </div>
            <div className="property-field">
              <label className="property-label">Start date</label>
              <div className="property-input">
                <span>{startDate}</span>
                <IconCalendar className="calendar-icon" />
              </div>
            </div>
          </div>

          <div className="properties-column">
            <div className="property-field">
              <label className="property-label">Progress</label>
              <div className="property-input">
                <div className="radio-indicator"></div>
                <span>{progress}</span>
                <IconChevronDown className="dropdown-icon" />
              </div>
            </div>
            <div className="property-field">
              <label className="property-label">Priority</label>
              <div className="property-input">
                <div className="priority-dot" style={{ backgroundColor: getPriorityColor(priority) }}></div>
                <span>{priority}</span>
                <IconChevronDown className="dropdown-icon" />
              </div>
            </div>
            <div className="property-field">
              <label className="property-label">Due date</label>
              <div className="property-input">
                <span>{dueDate}</span>
                <IconCalendar className="calendar-icon" />
              </div>
            </div>
            <div className="property-field">
              <label className="property-label">Repeat</label>
              <div className="property-input">
                <IconRepeat className="repeat-icon" />
                <span>{repeat}</span>
                <IconChevronDown className="dropdown-icon" />
              </div>
            </div>
          </div>
        </div>

        <div className="task-notes-section">
          <div className="notes-header">
            <label className="notes-label">Notes</label>
            <label className="notes-checkbox-label">
              <input
                type="checkbox"
                checked={showNotesOnCard}
                onChange={(e) => setShowNotesOnCard(e.target.checked)}
                className="notes-checkbox"
              />
              Show on card
            </label>
          </div>
          <div className="notes-content">
            <ul className="notes-list">
              <li>Build editing mode toggle and form state</li>
              <li>Implement optimistic updates with rollback</li>
              <li>Create validation system for editable fields</li>
              <li>Handle PATCH API integration for updates</li>
              <li>Manage complex modal state transitions</li>
              <li>Error handling and user feedback system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

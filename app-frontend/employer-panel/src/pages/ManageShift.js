import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../lib/http';
import translations from '../i18n/translations';
import './ManageShift.css';

// ─── Dynamic status tag colors (kept as JS since they depend on data) ───
const getStatusTagColors = (status) => ({
  color:
    status === 'Completed'
      ? '#2E7D32'
      : status === 'In Progress'
        ? '#7B1FA2'
        : status === 'Pending'
          ? '#F57C00'
          : status === 'Open'
            ? '#1565C0'
            : status === 'Draft'
              ? '#6B4C8C'
              : '#757575',
  backgroundColor:
    status === 'Completed'
      ? '#EAFAE7'
      : status === 'In Progress'
        ? '#F6EFFF'
        : status === 'Pending'
          ? '#FBFAE2'
          : status === 'Open'
            ? '#E3F2FD'
            : status === 'Draft'
              ? '#F3E8FF'
              : '#F5F5F5',
});

// ─── Map backend status to filter display ───
const statusDisplayMap = {
  completed: 'Completed',
  assigned: 'In Progress',
  applied: 'Pending',
  open: 'Open',
  draft: 'Draft',
};

const Filter = Object.freeze({
  All: 'All',
  Draft: 'Draft',
  Completed: 'Completed',
  InProgress: 'In Progress',
  Pending: 'Pending',
  Open: 'Open',
});

const editableStatuses = [Filter.Open, Filter.Pending, Filter.InProgress, Filter.Completed];

const Sort = Object.freeze({
  DateAsc: 'Date (Asc)',
  DateDesc: 'Date (Desc)',
});

const TABS = Object.freeze({
  DETAILS: 'details',
  APPLICANTS: 'applicants',
  EQUIPMENT: 'equipment',
});
const EQ_TABS = Object.freeze({ ISSUED: 'issued', ASSESS: 'assess', SUMMARY: 'summary' });

const EQ_CATEGORIES = [
  { value: 'comms', label: 'Comms', color: '#185FA5' },
  { value: 'safety', label: 'Safety', color: '#3B6D11' },
  { value: 'access', label: 'Access', color: '#993C1D' },
  { value: 'other', label: 'Other', color: '#5F5E5A' },
];

const catColor = (cat) => EQ_CATEGORIES.find((c) => c.value === cat)?.color ?? '#5F5E5A';
const catLabel = (cat) => EQ_CATEGORIES.find((c) => c.value === cat)?.label ?? 'Other';

const CONDITIONS = [
  {
    value: 'good',
    label: 'Good',
    icon: '✓',
    activeBg: '#EAF3DE',
    activeColor: '#3B6D11',
    activeBorder: '#97C459',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    icon: '~',
    activeBg: '#FAEEDA',
    activeColor: '#854F0B',
    activeBorder: '#EF9F27',
  },
  {
    value: 'damaged',
    label: 'Damaged',
    icon: '✕',
    activeBg: '#FCEBEB',
    activeColor: '#A32D2D',
    activeBorder: '#E24B4A',
  },
];

const condStyle = (cond) => CONDITIONS.find((c) => c.value === cond);

function fmtTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Normalize shift data from backend
const normalizeShift = (s) => ({
  id: s._id,
  title: s.title || '--',
  date: s.date,
  startTime: s.startTime,
  endTime: s.endTime,
  dateTime: s.date && s.startTime ? `${s.date} ${s.startTime}` : s.date || '',
  locationLabel: s.location
    ? [s.location.street, s.location.suburb, s.location.state].filter(Boolean).join(', ')
    : '--',
  location: s.location || {},
  status: statusDisplayMap[s.status?.toLowerCase()] || 'Open',
  payRate: s.payRate ?? s.price ?? '--',
  urgency: s.urgency || 'normal',
  field: s.field || '',
  applicantCount: s.applicantCount ?? (Array.isArray(s.applicants) ? s.applicants.length : 0),
  applicants: Array.isArray(s.applicants) ? s.applicants : [],
  assignedGuard: s.assignedGuard || s.acceptedBy || null,
});

// ─── Sub-components ───
const SummaryCard = ({ label, number, icon, bg, cardClass }) => (
  <div className={`ms-summary-card ${cardClass || ''}`} style={{ backgroundColor: bg }}>
    <div>
      <p className="ms-summary-label">{label}</p>
      <p className="ms-summary-number">{number}</p>
    </div>
    <div>
      <img src={icon} alt={label} className="ms-icon-big" />
    </div>
  </div>
);

const FilterSortSection = ({
  Filter,
  selectedFilter,
  onFilterChange,
  sortBy,
  setShowSortModal,
}) => (
  <div className="ms-filter-section">
    <div className="ms-filter-group">
      <img src={'/ic-filter.svg'} alt="Filter" className="ms-icon-small" />
      <span className="ms-filter-label">Filter by:</span>
      <div className="ms-filter-buttons">
        {Object.values(Filter).map((f) => (
          <button
            key={f}
            className={`ms-filter-button${selectedFilter === f ? ' ms-filter-button--active' : ''}`}
            onClick={() => onFilterChange(f)}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
    <div className="ms-sort-group">
      <img src={'/ic-sort.svg'} alt="Sort" className="ms-icon-small" />
      <span className="ms-filter-label">Sort by:</span>
      <button className="ms-sort-button" onClick={() => setShowSortModal(true)}>
        {sortBy} <span style={{ fontSize: '10px' }}>▼</span>
      </button>
    </div>
  </div>
);

const Pagination = ({
  totalPages,
  currentPage,
  goPrevPage,
  goNextPage,
  goToPage,
  getPaginationNumbers,
}) => (
  <div className="ms-pagination">
    <button
      onClick={goPrevPage}
      disabled={currentPage === 1}
      className={`ms-pagination-button${currentPage === 1 ? ' ms-pagination-button--disabled' : ''}`}
    >
      <img src={'/ic-arrow-back.svg'} alt="Previous" className="ms-icon-small" />
    </button>
    {getPaginationNumbers().map((page, index) => (
      <button
        key={index}
        onClick={() => (typeof page === 'number' ? goToPage(page) : null)}
        className={`ms-pagination-button${page === currentPage ? ' ms-pagination-button--active' : ''}`}
        disabled={page === '...'}
      >
        {page}
      </button>
    ))}
    <button
      onClick={goNextPage}
      disabled={currentPage === totalPages}
      className={`ms-pagination-button${currentPage === totalPages ? ' ms-pagination-button--disabled' : ''}`}
    >
      <img src={'/ic-arrow-forward.svg'} alt="Next" className="ms-icon-small" />
    </button>
  </div>
);

const SortModal = ({ Sort, sortBy, selectSortBy, setShowSortModal }) => (
  <div className="ms-modal-overlay" onClick={() => setShowSortModal(false)}>
    <div className="ms-modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="ms-modal-header">
        <h3 className="ms-modal-title">Sort by</h3>
        <button className="ms-modal-close" onClick={() => setShowSortModal(false)}>
          ×
        </button>
      </div>
      <div className="ms-modal-body">
        {Object.values(Sort).map((option) => (
          <button
            key={option}
            className={`ms-sort-option${option === sortBy ? ' ms-sort-option--active' : ''}`}
            onClick={() => selectSortBy(option)}
          >
            {option} {option === sortBy && <span className="ms-checkmark">✓</span>}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ─── Chat Icon ───
const ChatIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const generateAiRecommendation = (applicant, shift) => {
  let score = 60;
  const reasons = [];

  if (
    applicant.licenseType &&
    shift.field &&
    applicant.licenseType.toLowerCase().includes(shift.field.toLowerCase())
  ) {
    score += 20;
    reasons.push('License matches shift field');
  }

  if (shift.urgency === 'priority') {
    score += 10;
    reasons.push('Suitable for priority shifts');
  }

  if (shift.status === 'Open') {
    score += 5;
    reasons.push('Available immediately');
  }

  if (score >= 90) {
    reasons.push('Highly recommended candidate');
  }

  return {
    score,
    recommended: score >= 80,
    reasons,
  };
};

// ─── Applicants Panel ───
const ApplicantsPanel = ({ shift, applicantAction, onApprove, onReject }) => {
  const applicants = shift.applicants || [];

  if (applicants.length === 0) {
    return (
      <div className="ms-empty-applicants">
        <div className="ms-empty-icon">👥</div>
        <p style={{ margin: '8px 0 4px', fontWeight: 600, color: 'var(--text-primary)' }}>
          No applicants yet
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Guards who apply for this shift will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="ms-applicants-panel">
      <div className="ms-applicants-list">
        {applicants.map((applicant) => {
          const ai = generateAiRecommendation(applicant, shift);
          const gid = applicant._id || applicant.id;
          const action = applicantAction[gid];
          const isApproved = action === 'approved';
          const isRejected = action === 'rejected';

          return (
            <div
              key={gid}
              className={`ms-applicant-card${isApproved ? ' ms-applicant-card--approved' : ''}`}
            >
              <div className="ms-avatar">
                {(applicant.name || applicant.email || 'G').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p className="ms-applicant-name">{applicant.name || 'Unknown Guard'}</p>
                <p className="ms-applicant-email">{applicant.email || '--'}</p>
                <div className="ai-card">
                  <p className="ai-title">AI Recommendation</p>
                  <div className="ai-score">Match Score: {ai.score}%</div>
                  <div
                    className={`ai-verdict ${ai.recommended ? 'ai-verdict--recommended' : 'ai-verdict--review'}`}
                  >
                    {ai.recommended ? 'Recommended Candidate' : 'Needs Manual Review'}
                  </div>
                  {ai.reasons.map((reason, index) => (
                    <div key={index} className="ai-reason">
                      • {reason}
                    </div>
                  ))}
                </div>
                {applicant.licenseType && (
                  <span className="ms-license-badge">{applicant.licenseType}</span>
                )}
              </div>
              <div className="ms-applicant-actions">
                {isApproved ? (
                  <span className="ms-approved-pill">✓ Approved</span>
                ) : isRejected ? (
                  <span className="ms-rejected-pill">✗ Rejected</span>
                ) : (
                  <>
                    <button
                      className="ms-approve-button"
                      onClick={() => onApprove(gid)}
                      disabled={action === 'approving'}
                    >
                      {action === 'approving' ? '...' : 'Approve'}
                    </button>
                    <button
                      className="ms-reject-button"
                      onClick={() => onReject(gid)}
                      disabled={action === 'rejecting'}
                    >
                      {action === 'rejecting' ? '...' : 'Reject'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Equipment Panel Component ───
const EquipmentPanel = ({
  shift,
  eqTab,
  setEqTab,
  equipmentList,
  eqAuditLog,
  newEqName,
  setNewEqName,
  newEqCat,
  setNewEqCat,
  newEqQty,
  setNewEqQty,
  onAdd,
  onRemove,
  onSetCondition,
  onSetNote,
  healthScore,
  phaseLabel,
}) => {
  const isInProgress = shift.status === 'In Progress';
  const isCompleted = shift.status === 'Completed';
  const total = equipmentList.length;
  const assessed = equipmentList.filter((i) => i.condition !== null).length;
  const good = equipmentList.filter((i) => i.condition === 'good').length;
  const moderate = equipmentList.filter((i) => i.condition === 'moderate').length;
  const damaged = equipmentList.filter((i) => i.condition === 'damaged').length;
  const unassessed = total - assessed;
  const scoreColor = healthScore >= 80 ? '#3B6D11' : healthScore >= 50 ? '#854F0B' : '#A32D2D';

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ marginBottom: '14px' }}>
        <span
          className="eq-phase-badge"
          style={{ background: phaseLabel.bg, color: phaseLabel.color }}
        >
          {phaseLabel.label}
        </span>
      </div>

      <div className="eq-tab-bar">
        {[
          { key: EQ_TABS.ISSUED, label: `Issued items${total > 0 ? ` (${total})` : ''}` },
          {
            key: EQ_TABS.ASSESS,
            label: `Return & Assess${assessed > 0 ? ` (${assessed}/${total})` : ''}`,
          },
          { key: EQ_TABS.SUMMARY, label: 'Summary' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`eq-sub-tab${eqTab === key ? ' eq-sub-tab--active' : ''}`}
            onClick={() => setEqTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {eqTab === EQ_TABS.ISSUED && (
        <div>
          {isInProgress && (
            <div className="eq-add-row">
              <input
                value={newEqName}
                onChange={(e) => setNewEqName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                placeholder="Equipment name (e.g. Radio, Torch, Hi-vis vest)"
                className="eq-input"
                style={{ flex: 1 }}
              />
              <select
                value={newEqCat}
                onChange={(e) => setNewEqCat(e.target.value)}
                className="eq-select"
              >
                {EQ_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                max="99"
                value={newEqQty}
                onChange={(e) => setNewEqQty(parseInt(e.target.value) || 1)}
                className="eq-input"
                style={{ width: '64px', textAlign: 'center' }}
              />
              <button className="eq-primary-btn" onClick={onAdd}>
                + Add
              </button>
            </div>
          )}

          {total === 0 ? (
            <div className="eq-empty">
              <div className="eq-empty-icon">📦</div>
              <p style={{ margin: '8px 0 4px', fontWeight: 600, color: 'var(--text-primary)' }}>
                No equipment added yet
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                {isInProgress
                  ? 'Add items the guard has been issued for this shift.'
                  : 'No equipment was recorded for this shift.'}
              </p>
            </div>
          ) : (
            <div className="eq-list">
              {equipmentList.map((item, idx) => (
                <div key={item.id} className="eq-item">
                  <span className="eq-idx">{idx + 1}</span>
                  <span
                    className="eq-cat-dot"
                    style={{ background: catColor(item.cat) }}
                    title={catLabel(item.cat)}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="eq-item-name">{item.name}</p>
                    <p className="eq-item-meta">
                      <span
                        className="eq-cat-chip"
                        style={{
                          color: catColor(item.cat),
                          borderColor: catColor(item.cat) + '55',
                          background: catColor(item.cat) + '12',
                        }}
                      >
                        {catLabel(item.cat)}
                      </span>
                      <span>×{item.qty}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Added {item.addedAt}</span>
                    </p>
                  </div>
                  {item.condition && (
                    <span
                      className="eq-cond-chip"
                      style={{
                        background: condStyle(item.condition).activeBg,
                        color: condStyle(item.condition).activeColor,
                        borderColor: condStyle(item.condition).activeBorder,
                      }}
                    >
                      {condStyle(item.condition).label}
                    </span>
                  )}
                  {isInProgress && (
                    <button
                      className="eq-remove-btn"
                      onClick={() => onRemove(item.id)}
                      title={`Remove ${item.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {isInProgress && (
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    margin: '6px 0 0',
                    textAlign: 'right',
                  }}
                >
                  {total} item{total !== 1 ? 's' : ''} — switch to Return & Assess when guard
                  returns equipment.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {eqTab === EQ_TABS.ASSESS && (
        <div>
          {total === 0 ? (
            <div className="eq-empty">
              <div className="eq-empty-icon">🔄</div>
              <p style={{ margin: '8px 0 4px', fontWeight: 600, color: 'var(--text-primary)' }}>
                No items to assess
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                Add equipment in the Issued Items tab first.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                Mark each returned item as <strong>Good</strong>, <strong>Moderate</strong> (minor
                wear, acceptable), or <strong>Damaged</strong>.
              </p>
              <div className="eq-list">
                {equipmentList.map((item) => {
                  const canAssess = isCompleted || isInProgress;
                  return (
                    <div
                      key={item.id}
                      className={`eq-item${item.condition ? ' eq-item--assessed' : ''}`}
                    >
                      <span className="eq-cat-dot" style={{ background: catColor(item.cat) }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="eq-item-name">
                          {item.name}
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 400,
                              color: 'var(--text-secondary)',
                              marginLeft: 4,
                            }}
                          >
                            ×{item.qty}
                          </span>
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
                            marginTop: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {CONDITIONS.map((cond) => {
                            const isActive = item.condition === cond.value;
                            return (
                              <button
                                key={cond.value}
                                disabled={!canAssess}
                                onClick={() => onSetCondition(item.id, cond.value)}
                                className="eq-cond-btn"
                                style={
                                  isActive
                                    ? {
                                        background: cond.activeBg,
                                        color: cond.activeColor,
                                        borderColor: cond.activeBorder,
                                      }
                                    : undefined
                                }
                              >
                                {cond.icon} {cond.label}
                              </button>
                            );
                          })}
                        </div>
                        {item.condition && (
                          <input
                            value={item.note || ''}
                            onChange={(e) => onSetNote(item.id, e.target.value)}
                            placeholder="Add a note (e.g. cracked lens, battery dead)…"
                            className="eq-note-input"
                            disabled={!canAssess}
                          />
                        )}
                      </div>
                      <div style={{ flexShrink: 0, fontSize: '18px' }}>
                        {item.condition ? (
                          <span style={{ color: '#3B6D11' }}>✓</span>
                        ) : (
                          <span style={{ color: 'var(--border)' }}>○</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {isInProgress && (
                <div
                  className="eq-alert"
                  style={{
                    background: '#FAEEDA',
                    color: '#854F0B',
                    borderColor: '#FAC775',
                    marginTop: '12px',
                  }}
                >
                  ⏳ Condition assessment is available now. Items will be locked once the shift is
                  marked Completed.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {eqTab === EQ_TABS.SUMMARY && (
        <div>
          <div className="eq-summary-grid">
            {[
              { label: 'Total items', value: total, color: 'var(--text-primary)' },
              { label: 'Good', value: good, color: '#3B6D11' },
              { label: 'Moderate', value: moderate, color: '#854F0B' },
              { label: 'Damaged', value: damaged, color: '#A32D2D' },
            ].map(({ label, value, color }) => (
              <div key={label} className="eq-stat-card">
                <p className="eq-stat-num" style={{ color }}>
                  {value}
                </p>
                <p className="eq-stat-label">{label}</p>
              </div>
            ))}
          </div>

          {total > 0 && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  margin: '16px 0 6px',
                }}
              >
                <span style={{ fontSize: '28px', fontWeight: 700, color: scoreColor }}>
                  {healthScore}%
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  equipment health — {assessed}/{total} items assessed
                </span>
              </div>
              <div className="eq-progress-bar">
                <div
                  className="eq-progress-seg"
                  style={{
                    width: `${total ? Math.round((good / total) * 100) : 0}%`,
                    background: '#97C459',
                  }}
                />
                <div
                  className="eq-progress-seg"
                  style={{
                    width: `${total ? Math.round((moderate / total) * 100) : 0}%`,
                    background: '#EF9F27',
                  }}
                />
                <div
                  className="eq-progress-seg"
                  style={{
                    width: `${total ? Math.round((damaged / total) * 100) : 0}%`,
                    background: '#E24B4A',
                  }}
                />
                <div className="eq-progress-seg" style={{ flex: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', gap: '16px', margin: '6px 0 16px', flexWrap: 'wrap' }}>
                {[
                  { dot: '#97C459', label: `Good (${good})` },
                  { dot: '#EF9F27', label: `Moderate (${moderate})` },
                  { dot: '#E24B4A', label: `Damaged (${damaged})` },
                  { dot: '#d1d5db', label: `Unassessed (${unassessed})` },
                ].map(({ dot, label }) => (
                  <span
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: dot,
                        display: 'inline-block',
                      }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}

          {damaged > 0 && (
            <div
              className="eq-alert"
              style={{ background: '#FCEBEB', color: '#A32D2D', borderColor: '#F09595' }}
            >
              ⚠️{' '}
              <strong>
                {damaged} damaged item{damaged > 1 ? 's' : ''}
              </strong>{' '}
              — review notes and initiate an incident report if needed.
            </div>
          )}

          {unassessed > 0 && (
            <div
              className="eq-alert"
              style={{
                background: '#FAEEDA',
                color: '#854F0B',
                borderColor: '#FAC775',
                marginTop: '8px',
              }}
            >
              🕐{' '}
              <strong>
                {unassessed} item{unassessed > 1 ? 's' : ''} not yet assessed
              </strong>{' '}
              — return to the Return & Assess tab.
            </div>
          )}

          {equipmentList.some((i) => i.note) && (
            <div style={{ marginTop: '16px' }}>
              <p className="eq-section-label">Notes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {equipmentList
                  .filter((i) => i.note)
                  .map((item) => (
                    <div key={item.id} style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                      <span
                        className="eq-cat-dot"
                        style={{ background: catColor(item.cat), marginTop: 4 }}
                      />
                      <span style={{ color: 'var(--text-primary)' }}>
                        <strong>{item.name}:</strong> {item.note}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {eqAuditLog.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p className="eq-section-label">Audit trail</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[...eqAuditLog].reverse().map((entry, i) => (
                  <div key={i} className="eq-audit-item">
                    <span
                      className="eq-cat-dot"
                      style={{ background: entry.color, flexShrink: 0, marginTop: 4 }}
                    />
                    <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {entry.text}
                    </span>
                    <span
                      style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0 }}
                    >
                      {entry.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───
const ManageShift = ({ language }) => {
  const t = translations[language || 'en'] || translations.en;
  const navigate = useNavigate();

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState(Filter.All);
  const [sortBy, setSortBy] = useState(Sort.DateAsc);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [detailForm, setDetailForm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [optimisticSnapshot, setOptimisticSnapshot] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.DETAILS);
  const [applicantAction, setApplicantAction] = useState({});
  const [chatPollInterval, setChatPollInterval] = useState(null);
  const itemsPerPage = 9;

  // Equipment state
  const [eqTab, setEqTab] = useState(EQ_TABS.ISSUED);
  const [equipmentList, setEquipmentList] = useState([]);
  const [eqAuditLog, setEqAuditLog] = useState([]);
  const [newEqName, setNewEqName] = useState('');
  const [newEqCat, setNewEqCat] = useState('other');
  const [newEqQty, setNewEqQty] = useState(1);
  const eqNextId = useRef(1);

  // Chat state
  const [chatShift, setChatShift] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const { data } = await http.get('/shifts');
        let apiShifts;
        if (Array.isArray(data)) apiShifts = data;
        else if (Array.isArray(data.shifts)) apiShifts = data.shifts;
        else if (data.items && Array.isArray(data.items)) apiShifts = data.items;
        else apiShifts = [];
        setShifts(apiShifts.map(normalizeShift));
      } catch (err) {
        setError(err?.response?.data?.message || 'Error fetching shifts.');
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Equipment helpers
  const addEquipment = () => {
    const name = newEqName.trim();
    if (!name) return;
    const t = fmtTime(new Date());
    const item = {
      id: eqNextId.current++,
      name,
      cat: newEqCat,
      qty: Math.max(1, newEqQty || 1),
      condition: null,
      note: '',
      addedAt: t,
    };
    setEquipmentList((prev) => [...prev, item]);
    setEqAuditLog((prev) => [
      ...prev,
      { text: `${name} ×${item.qty} added`, color: catColor(newEqCat), time: t },
    ]);
    setNewEqName('');
    setNewEqQty(1);
  };

  const removeEquipment = (id) => {
    const item = equipmentList.find((i) => i.id === id);
    if (item)
      setEqAuditLog((prev) => [
        ...prev,
        { text: `${item.name} removed from list`, color: '#888780', time: fmtTime(new Date()) },
      ]);
    setEquipmentList((prev) => prev.filter((i) => i.id !== id));
  };

  const setCondition = (id, cond) => {
    const item = equipmentList.find((i) => i.id === id);
    if (!item || item.condition === cond) return;
    setEquipmentList((prev) => prev.map((i) => (i.id === id ? { ...i, condition: cond } : i)));
    const c = condStyle(cond);
    setEqAuditLog((prev) => [
      ...prev,
      {
        text: `${item.name} marked as ${c.label}`,
        color: c.activeColor,
        time: fmtTime(new Date()),
      },
    ]);
  };

  const setEqNote = (id, note) => {
    setEquipmentList((prev) => prev.map((i) => (i.id === id ? { ...i, note } : i)));
  };

  const eqHealthScore = () => {
    if (!equipmentList.length) return 0;
    const score = equipmentList.reduce(
      (acc, i) => acc + (i.condition === 'good' ? 1 : i.condition === 'moderate' ? 0.6 : 0),
      0
    );
    return Math.round((score / equipmentList.length) * 100);
  };

  const eqPhaseLabel = () => {
    const total = equipmentList.length;
    const assessed = equipmentList.filter((i) => i.condition !== null).length;
    if (total === 0) return { label: 'Setup phase', color: '#185FA5', bg: '#E6F1FB' };
    if (assessed === 0)
      return {
        label: `${total} item${total > 1 ? 's' : ''} issued`,
        color: '#185FA5',
        bg: '#E6F1FB',
      };
    if (assessed < total)
      return { label: `${assessed}/${total} assessed`, color: '#854F0B', bg: '#FAEEDA' };
    return { label: 'All assessed ✓', color: '#3B6D11', bg: '#EAF3DE' };
  };

  // Chat handlers
  const openChatModal = async (shift) => {
    setChatShift(shift);
    setMessages([]);
    setNewMessage('');
    setLoadingMessages(true);

    const guardId = shift.assignedGuard?._id || shift.assignedGuard;

    const fetchMessages = async () => {
      try {
        const { data } = await http.get(`/messages/conversation/${guardId}`);
        setMessages(data.data?.conversation?.messages || []);
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    await fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    setChatPollInterval(interval);
  };

  const closeChatModal = () => {
    if (chatPollInterval) {
      clearInterval(chatPollInterval);
      setChatPollInterval(null);
    }
    setChatShift(null);
    setMessages([]);
    setNewMessage('');
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatShift || sendingMsg) return;
    setSendingMsg(true);
    try {
      const guardId = chatShift.assignedGuard?._id || chatShift.assignedGuard;
      const { data } = await http.post(`/messages`, { receiverId: guardId, content: newMessage });
      setMessages((prev) => [
        ...prev,
        {
          _id: data.data?.messageId,
          content: data.data?.content || newMessage,
          sender: { email: localStorage.getItem('userEmail'), _id: localStorage.getItem('userId') },
          isOwn: true,
          timestamp: data.data?.timestamp || new Date().toISOString(),
        },
      ]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter / sort / pagination
  const filteredShifts =
    selectedFilter === Filter.All ? shifts : shifts.filter((s) => s.status === selectedFilter);
  const sortedShifts = [...filteredShifts].sort((a, b) => {
    const keyA = (a.date || '') + ' ' + (a.startTime || '');
    const keyB = (b.date || '') + ' ' + (b.startTime || '');
    if (keyA !== keyB)
      return sortBy === Sort.DateAsc ? (keyA < keyB ? -1 : 1) : keyA > keyB ? -1 : 1;
    const endA = a.endTime || '',
      endB = b.endTime || '';
    if (endA === endB) return 0;
    return sortBy === Sort.DateAsc ? (endA < endB ? -1 : 1) : endA > endB ? -1 : 1;
  });

  const totalPages = Math.ceil(sortedShifts.length / itemsPerPage);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) setCurrentPage(totalPages);
    else if (currentPage < 1) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const indexStart = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedShifts.slice(indexStart, indexStart + itemsPerPage);

  const totalShifts = shifts.length;
  const completedShifts = shifts.filter((s) => s.status === 'Completed').length;
  const inProgressShifts = shifts.filter((s) => s.status === 'In Progress').length;
  const pendingShifts = shifts.filter((s) => s.status === 'Pending').length;
  const draftShifts = shifts.filter((s) => s.status === 'Draft').length;

  const goPrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToPage = (page) => setCurrentPage(page);

  const getPaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  const selectSortBy = (sortOption) => {
    setSortBy(sortOption);
    setShowSortModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date)) return '--';
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTimeRange = (start, end) => {
    if (!start || !end) return '--';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return '--';
    return `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')} - ${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  };

  // ─── DELETE handler ───
  const handleDeleteShift = async (shiftId) => {
    if (
      !window.confirm('Are you sure you want to delete this shift? This action cannot be undone.')
    )
      return;
    try {
      await http.delete(`/shifts/${shiftId}`);
      setShifts((prev) => prev.filter((s) => s.id !== shiftId));
      setFeedback('Shift deleted successfully');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete shift';
      setFeedback(msg);
      console.error('Delete error:', err);
    }
  };

  // ─── EDIT handler ───
  const handleEditShift = (shiftId) => {
    navigate(`/create-shift?edit=${shiftId}`);
  };

  // ─── Detail modal handlers ───
  const openShiftModal = (shift) => {
    setSelectedShift(shift);
    setDetailForm({
      title: shift.title || '',
      date: shift.date ? shift.date.substring(0, 10) : '',
      startTime: shift.startTime || '',
      endTime: shift.endTime || '',
      payRate: shift.payRate === '--' ? '' : (shift.payRate ?? ''),
      street: shift.location?.street || '',
      suburb: shift.location?.suburb || '',
      state: shift.location?.state || '',
      postcode: shift.location?.postcode || '',
      field: shift.field || '',
      urgency: shift.urgency || 'normal',
      status: shift.status || Filter.Open,
    });
    setIsEditing(false);
    setFeedback('');
    setActiveTab(
      shift.status === Filter.Open || shift.status === Filter.Pending
        ? TABS.APPLICANTS
        : TABS.DETAILS
    );
    setApplicantAction({});
    setEquipmentList([]);
    setEqAuditLog([{ text: 'Equipment tab opened', color: '#888780', time: fmtTime(new Date()) }]);
    setNewEqName('');
    setNewEqCat('other');
    setNewEqQty(1);
    setEqTab(EQ_TABS.ISSUED);
    eqNextId.current = 1;
  };

  const closeShiftModal = () => {
    setSelectedShift(null);
    setDetailForm(null);
    setIsEditing(false);
    setSaving(false);
    setFeedback('');
    setApplicantAction({});
    setEquipmentList([]);
    setEqAuditLog([]);
    setNewEqName('');
    setNewEqCat('other');
    setNewEqQty(1);
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetailForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateDetailForm = () => {
    const errs = {};
    if (!detailForm.title?.trim()) errs.title = 'Title required';
    if (!detailForm.date?.trim()) errs.date = 'Date required';
    if (!detailForm.startTime?.trim()) errs.startTime = 'Start time required';
    if (!detailForm.endTime?.trim()) errs.endTime = 'End time required';
    if (detailForm.payRate !== '' && Number(detailForm.payRate) < 0)
      errs.payRate = 'Pay rate must be positive';
    if (!editableStatuses.includes(detailForm.status)) errs.status = 'Please select a valid status';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveShift = async () => {
    if (!selectedShift || !detailForm) return;
    if (selectedShift.status === Filter.Completed) {
      setFeedback('Completed shifts cannot be edited.');
      return;
    }
    if (!validateDetailForm()) return;

    setSaving(true);
    setFeedback('');

    try {
      const cleanedLocation = {
        street: detailForm.street?.trim() || undefined,
        suburb: detailForm.suburb?.trim() || undefined,
        state: detailForm.state?.trim() || undefined,
        postcode: detailForm.postcode?.trim() || undefined,
      };
      const hasLocation = Object.values(cleanedLocation).some(Boolean);

      const payload = {
        title: detailForm.title,
        date: detailForm.date,
        startTime: detailForm.startTime,
        endTime: detailForm.endTime,
        payRate: detailForm.payRate === '' ? undefined : Number(detailForm.payRate),
        ...(detailForm.field?.trim() ? { field: detailForm.field.trim() } : {}),
        urgency: detailForm.urgency,
        ...(hasLocation ? { location: cleanedLocation } : {}),
      };

      setOptimisticSnapshot({ shifts, selectedShift });
      const optimistic = { ...selectedShift, ...payload, status: detailForm.status };
      setShifts((prev) =>
        prev.map((s) => (s.id === selectedShift.id ? { ...s, ...optimistic } : s))
      );

      const { data } = await http.patch(`/shifts/${selectedShift.id}`, payload);
      const updated = normalizeShift(data.shift || { ...selectedShift, ...payload });
      const updatedWithUiStatus = { ...updated, status: detailForm.status };

      setShifts((prev) =>
        prev.map((s) => (s.id === updatedWithUiStatus.id ? { ...s, ...updatedWithUiStatus } : s))
      );
      setSelectedShift(updatedWithUiStatus);
      setDetailForm({
        title: updatedWithUiStatus.title || '',
        date: updatedWithUiStatus.date ? updatedWithUiStatus.date.substring(0, 10) : '',
        startTime: updatedWithUiStatus.startTime || '',
        endTime: updatedWithUiStatus.endTime || '',
        payRate: updatedWithUiStatus.payRate === '--' ? '' : (updatedWithUiStatus.payRate ?? ''),
        street: updatedWithUiStatus.location?.street || '',
        suburb: updatedWithUiStatus.location?.suburb || '',
        state: updatedWithUiStatus.location?.state || '',
        postcode: updatedWithUiStatus.location?.postcode || '',
        field: updatedWithUiStatus.field || '',
        urgency: updatedWithUiStatus.urgency || 'normal',
        status: updatedWithUiStatus.status || Filter.Open,
      });
      setIsEditing(false);
      setFeedback('Saved successfully');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update shift';
      setFeedback(message);
      if (optimisticSnapshot) {
        setShifts(optimisticSnapshot.shifts);
        setSelectedShift(optimisticSnapshot.selectedShift);
      }
    } finally {
      setSaving(false);
    }
  };

  // Approval workflow
  const handleApproveGuard = async (guardId) => {
    if (!selectedShift) return;
    setApplicantAction((prev) => ({ ...prev, [guardId]: 'approving' }));
    try {
      const { data } = await http.put(`/shifts/${selectedShift.id}/approve`, { guardId });
      const approvedGuard = selectedShift.applicants.find((a) => (a._id || a.id) === guardId);
      const updatedShift = normalizeShift(
        data.shift || {
          ...selectedShift,
          status: 'assigned',
          assignedGuard: data.assignedGuard || approvedGuard || guardId,
        }
      );
      setShifts((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
      setSelectedShift(updatedShift);
      setApplicantAction((prev) => ({ ...prev, [guardId]: 'approved' }));
      setFeedback('Guard approved. Shift is now In Progress.');
    } catch (err) {
      setFeedback(err?.response?.data?.message || 'Failed to approve guard');
      setApplicantAction((prev) => ({ ...prev, [guardId]: undefined }));
    }
  };

  const handleRejectGuard = async (guardId) => {
    if (!selectedShift) return;
    setApplicantAction((prev) => ({ ...prev, [guardId]: 'rejecting' }));
    try {
      const updatedApplicants = selectedShift.applicants.filter((a) => (a._id || a.id) !== guardId);
      const updatedShift = {
        ...selectedShift,
        applicants: updatedApplicants,
        applicantCount: updatedApplicants.length,
      };
      setShifts((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
      setSelectedShift(updatedShift);
      setApplicantAction((prev) => {
        const n = { ...prev };
        delete n[guardId];
        return n;
      });
    } catch (err) {
      setFeedback(err?.response?.data?.message || 'Failed to reject guard');
      setApplicantAction((prev) => ({ ...prev, [guardId]: undefined }));
    }
  };

  const showApplicantsTab =
    selectedShift?.status === Filter.Open || selectedShift?.status === Filter.Pending;
  const showEquipmentTab =
    selectedShift?.status === 'In Progress' || selectedShift?.status === 'Completed';

  // ─── Summary card classes for dark mode ───
  const getSummaryCardClass = (label) => {
    if (label === 'Total shifts') return 'ms-summary-total';
    if (label === 'Completed shifts') return 'ms-summary-completed';
    if (label === 'In-Progress shifts') return 'ms-summary-inprogress';
    if (label === 'Pending shifts') return 'ms-summary-pending';
    if (label === 'Draft shifts') return 'ms-summary-draft';
    return '';
  };

  return (
    <div className="ms-container">
      <div className="ms-header">
        <h1 className="ms-title">{t.manageShifts}</h1>
        <button className="ms-add-button" onClick={() => navigate('/create-shift')}>
          <img src={'/ic-add.svg'} alt="Add" className="ms-icon-big" /> Add New Shift
        </button>
      </div>

      <div className="ms-summary-grid">
        <SummaryCard
          label="Total shifts"
          number={totalShifts}
          icon="/ic-task.svg"
          bg="#EFF4FF"
          cardClass={getSummaryCardClass('Total shifts')}
        />
        <SummaryCard
          label="Completed shifts"
          number={completedShifts}
          icon="/ic-completed.svg"
          bg="#EAFAE7"
          cardClass={getSummaryCardClass('Completed shifts')}
        />
        <SummaryCard
          label="In-Progress shifts"
          number={inProgressShifts}
          icon="/ic-lightning.svg"
          bg="#F6EFFF"
          cardClass={getSummaryCardClass('In-Progress shifts')}
        />
        <SummaryCard
          label="Pending shifts"
          number={pendingShifts}
          icon="/ic-hourglass.svg"
          bg="#FBFAE2"
          cardClass={getSummaryCardClass('Pending shifts')}
        />
        <SummaryCard
          label="Draft shifts"
          number={draftShifts}
          icon="/ic-lightning.svg"
          bg="#F3E8FF"
          cardClass={getSummaryCardClass('Draft shifts')}
        />
      </div>

      <FilterSortSection
        Filter={Filter}
        selectedFilter={selectedFilter}
        onFilterChange={(filter) => {
          setSelectedFilter(filter);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        setShowSortModal={setShowSortModal}
      />

      {loading && <p>Loading shifts...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && currentItems.length === 0 && <p>No shifts found.</p>}

      <div className="ms-grid">
        {currentItems.map((shift) => {
          const [datePart] = shift.dateTime?.split(' ') || [null];
          return (
            <div key={shift.id} className="ms-card">
              <div>
                <h3 className="ms-card-title">{shift.title}</h3>
                <div className="ms-card-header">
                  <div className="ms-status-tag" style={getStatusTagColors(shift.status)}>
                    {shift.status}
                  </div>
                  <div className="ms-price">
                    {shift.payRate !== '--' ? `$${shift.payRate}` : '--'}
                  </div>
                </div>
              </div>
              <div className="ms-card-details">
                <div className="ms-detail-row">
                  <img src={'/ic-location.svg'} alt="Location" className="ms-icon-small" />
                  <span className="ms-detail-text">{shift.locationLabel}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                  <div className="ms-detail-row">
                    <img src={'/ic-calendar.svg'} alt="Date" className="ms-icon-small" />
                    <span className="ms-detail-text">{formatDate(datePart)}</span>
                  </div>
                  <div className="ms-detail-row">
                    <img src={'/ic-clock.svg'} alt="Time" className="ms-icon-small" />
                    <span className="ms-detail-text">
                      {formatTimeRange(shift.startTime, shift.endTime)}
                    </span>
                  </div>
                </div>
                {shift.status === Filter.Open && shift.applicantCount > 0 && (
                  <div className="ms-applicant-badge">
                    <span className="ms-applicant-dot" />
                    {shift.applicantCount} applicant{shift.applicantCount !== 1 ? 's' : ''} pending
                    review
                  </div>
                )}
                <div className="ms-card-actions">
                  <button className="ms-view-details-button" onClick={() => openShiftModal(shift)}>
                    View Details
                  </button>
                  {shift.status === 'Draft' && (
                    <>
                      <button
                        className="ms-edit-button"
                        onClick={() => handleEditShift(shift.id)}
                        title="Edit draft"
                      >
                        ✏️
                      </button>
                      <button
                        className="ms-delete-button"
                        onClick={() => handleDeleteShift(shift.id)}
                        title="Delete draft"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                  {shift.status !== 'Draft' && (
                    <button
                      className="ms-delete-button"
                      onClick={() => handleDeleteShift(shift.id)}
                      title="Delete shift"
                    >
                      🗑️
                    </button>
                  )}
                  {shift.status === 'In Progress' && (
                    <button
                      className="ms-chat-icon-button"
                      onClick={() => openChatModal(shift)}
                      title="Open shift chat"
                    >
                      <ChatIcon />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !error && totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          goPrevPage={goPrevPage}
          goNextPage={goNextPage}
          goToPage={goToPage}
          getPaginationNumbers={getPaginationNumbers}
        />
      )}

      {showSortModal && (
        <SortModal
          Sort={Sort}
          sortBy={sortBy}
          selectSortBy={selectSortBy}
          setShowSortModal={setShowSortModal}
        />
      )}

      {/* ─── Shift Detail Modal ─── */}
      {selectedShift && detailForm && (
        <div
          className="ms-detail-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeShiftModal();
          }}
        >
          <div
            className="ms-detail-modal-content"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ms-detail-modal-header">
              <div>
                <p className="ms-detail-modal-overline">Secure Shift</p>
                <h2 className="ms-detail-modal-title">
                  {activeTab === TABS.APPLICANTS
                    ? 'Applicants'
                    : activeTab === TABS.EQUIPMENT
                      ? 'Equipment'
                      : isEditing
                        ? 'Edit Shift'
                        : 'Shift Details'}
                </h2>
                <p className="ms-detail-modal-subtitle">
                  {activeTab === TABS.APPLICANTS
                    ? `${selectedShift.applicants?.length ?? 0} applicant(s) for this shift.`
                    : activeTab === TABS.EQUIPMENT
                      ? 'Track issued equipment and assess condition on return.'
                      : 'Review and update shift fields.'}
                </p>
              </div>
              <button className="ms-modal-close-button" onClick={closeShiftModal}>
                ×
              </button>
            </div>

            {/* Tab bar */}
            <div className="ms-tab-bar">
              <button
                className={`ms-tab${activeTab === TABS.DETAILS ? ' ms-tab--active' : ''}`}
                onClick={() => setActiveTab(TABS.DETAILS)}
              >
                Details
              </button>
              {showApplicantsTab && (
                <button
                  className={`ms-tab${activeTab === TABS.APPLICANTS ? ' ms-tab--active' : ''}`}
                  onClick={() => setActiveTab(TABS.APPLICANTS)}
                >
                  Applicants
                  {(selectedShift.applicants?.length ?? 0) > 0 && (
                    <span className="ms-tab-badge">{selectedShift.applicants.length}</span>
                  )}
                </button>
              )}
              {showEquipmentTab && (
                <button
                  className={`ms-tab${activeTab === TABS.EQUIPMENT ? ' ms-tab--active' : ''}`}
                  onClick={() => setActiveTab(TABS.EQUIPMENT)}
                >
                  Equipment
                  {equipmentList.length > 0 && (
                    <span className="ms-tab-badge">{equipmentList.length}</span>
                  )}
                </button>
              )}
            </div>

            {feedback && (
              <div
                className={
                  feedback === 'Saved successfully' || feedback.includes('approved')
                    ? 'ms-feedback ms-feedback--success'
                    : 'ms-feedback ms-feedback--error'
                }
              >
                {feedback}
              </div>
            )}

            {/* ── Details tab ── */}
            {activeTab === TABS.DETAILS && (
              <>
                <div className="ms-detail-grid">
                  <div className="ms-detail-field">
                    <label className="ms-detail-label">Job Title</label>
                    <input
                      name="title"
                      value={detailForm.title}
                      onChange={handleDetailChange}
                      className="ms-input"
                      disabled={!isEditing}
                      placeholder="Job title"
                    />
                    {formErrors.title && (
                      <span className="ms-inline-error">{formErrors.title}</span>
                    )}
                  </div>
                  <div className="ms-detail-field">
                    <label className="ms-detail-label">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={detailForm.date}
                      onChange={handleDetailChange}
                      className="ms-input"
                      disabled={!isEditing}
                    />
                    {formErrors.date && <span className="ms-inline-error">{formErrors.date}</span>}
                  </div>
                  <div className="ms-detail-field">
                    <label className="ms-detail-label">Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      value={detailForm.startTime}
                      onChange={handleDetailChange}
                      className="ms-input"
                      disabled={!isEditing}
                    />
                    {formErrors.startTime && (
                      <span className="ms-inline-error">{formErrors.startTime}</span>
                    )}
                  </div>
                  <div className="ms-detail-field">
                    <label className="ms-detail-label">End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      value={detailForm.endTime}
                      onChange={handleDetailChange}
                      className="ms-input"
                      disabled={!isEditing}
                    />
                    {formErrors.endTime && (
                      <span className="ms-inline-error">{formErrors.endTime}</span>
                    )}
                  </div>
                  <div className="ms-detail-field">
                    <label className="ms-detail-label">Location</label>
                    <input
                      name="street"
                      value={detailForm.street}
                      onChange={handleDetailChange}
                      className="ms-input"
                      disabled={!isEditing}
                      placeholder="Street"
                    />
                  </div>
                  <div className="ms-detail-field">
                    <label className="ms-detail-label">Pay Rate</label>
                    <input
                      type="number"
                      name="payRate"
                      value={detailForm.payRate}
                      onChange={handleDetailChange}
                      className="ms-input"
                      disabled={!isEditing}
                      placeholder="0.00"
                    />
                    {formErrors.payRate && (
                      <span className="ms-inline-error">{formErrors.payRate}</span>
                    )}
                  </div>
                  <div className="ms-detail-field">
                    <label className="ms-detail-label">Field</label>
                    <input
                      name="field"
                      value={detailForm.field}
                      onChange={handleDetailChange}
                      className="ms-input"
                      disabled={!isEditing}
                      placeholder="e.g. Security"
                    />
                  </div>
                  <div className="ms-detail-field">
                    <label className="ms-detail-label">Urgency</label>
                    <select
                      name="urgency"
                      value={detailForm.urgency}
                      onChange={handleDetailChange}
                      className="ms-input"
                      disabled={!isEditing}
                    >
                      <option value="normal">Normal</option>
                      <option value="priority">Priority</option>
                      <option value="last-minute">Last-minute</option>
                    </select>
                  </div>
                  <div className="ms-detail-field">
                    <label className="ms-detail-label">Status</label>
                    <select
                      name="status"
                      value={detailForm.status}
                      onChange={handleDetailChange}
                      className="ms-input"
                      disabled={!isEditing}
                    >
                      {editableStatuses.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                    {formErrors.status && (
                      <span className="ms-inline-error">{formErrors.status}</span>
                    )}
                  </div>
                </div>
                <div className="ms-detail-actions">
                  {!isEditing ? (
                    <button
                      className="ms-primary-button"
                      onClick={() => {
                        setFeedback('');
                        setIsEditing(true);
                      }}
                    >
                      Edit Shift
                    </button>
                  ) : (
                    <>
                      <button
                        className="ms-primary-button"
                        onClick={handleSaveShift}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save changes'}
                      </button>
                      <button className="ms-secondary-button" onClick={closeShiftModal}>
                        Cancel edit
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── Applicants tab ── */}
            {activeTab === TABS.APPLICANTS && showApplicantsTab && (
              <ApplicantsPanel
                shift={selectedShift}
                applicantAction={applicantAction}
                onApprove={handleApproveGuard}
                onReject={handleRejectGuard}
              />
            )}

            {/* ── Equipment tab ── */}
            {activeTab === TABS.EQUIPMENT && showEquipmentTab && (
              <EquipmentPanel
                shift={selectedShift}
                eqTab={eqTab}
                setEqTab={setEqTab}
                equipmentList={equipmentList}
                eqAuditLog={eqAuditLog}
                newEqName={newEqName}
                setNewEqName={setNewEqName}
                newEqCat={newEqCat}
                setNewEqCat={setNewEqCat}
                newEqQty={newEqQty}
                setNewEqQty={setNewEqQty}
                onAdd={addEquipment}
                onRemove={removeEquipment}
                onSetCondition={setCondition}
                onSetNote={setEqNote}
                healthScore={eqHealthScore()}
                phaseLabel={eqPhaseLabel()}
              />
            )}
          </div>
        </div>
      )}

      {/* ─── Chat Modal ─── */}
      {chatShift && (
        <div className="chat-modal-overlay" onClick={closeChatModal}>
          <div className="chat-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-header">
              <div className="chat-modal-header-left">
                <div className="chat-logo">
                  <img
                    src="/logo.svg"
                    alt="SS"
                    style={{ width: '20px', height: '20px' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <p className="chat-modal-overline">SECURE SHIFT</p>
                  <p className="chat-modal-title">Shift Chat</p>
                </div>
              </div>
              <button className="chat-close-button" onClick={closeChatModal}>
                ×
              </button>
            </div>

            <div className="chat-shift-info-row">
              <span className="chat-pill">
                <span className="chat-pill-dot" />
                {chatShift.title}
              </span>
              <span className="chat-pill">
                📍 {chatShift.locationLabel !== '--' ? chatShift.locationLabel : 'Location TBD'}
              </span>
              <span className="chat-pill">
                🕐 {formatTimeRange(chatShift.startTime, chatShift.endTime)}
              </span>
            </div>

            {chatShift.assignedGuard && (
              <div className="chat-guard-name">
                • {chatShift.assignedGuard?.name || 'Assigned Guard'}
              </div>
            )}

            <div className="chat-messages-area">
              {loadingMessages ? (
                <div className="chat-empty">
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Loading messages...
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">
                  <div style={{ marginBottom: '8px' }}>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#d1d5db"
                      strokeWidth="1.5"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p
                    style={{
                      margin: '0 0 4px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    No messages yet
                  </p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const currentUserEmail = localStorage.getItem('userEmail');
                  const currentUserId = localStorage.getItem('userId');
                  const isOwn =
                    msg.isOwn ||
                    msg.sender?.email === currentUserEmail ||
                    msg.sender?._id?.toString() === currentUserId ||
                    msg.sender?.toString() === currentUserId;
                  return (
                    <div
                      key={msg._id || i}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                        marginBottom: '12px',
                      }}
                    >
                      {!isOwn && (
                        <span className="chat-sender-name">
                          {msg.senderName || msg.sender?.email || 'Guard'}
                        </span>
                      )}
                      <div className={isOwn ? 'chat-bubble-own' : 'chat-bubble-other'}>
                        {msg.content}
                      </div>
                      {msg.timestamp && (
                        <span className="chat-timestamp">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-area">
              <div className="chat-input-row">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Type a message..."
                  className="chat-input"
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingMsg || !newMessage.trim()}
                  className="chat-send-button"
                  style={{ opacity: sendingMsg || !newMessage.trim() ? 0.5 : 1 }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className="chat-footer-note">Messages are visible to all parties on this shift</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageShift;

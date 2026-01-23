import React, { useEffect, useMemo, useState } from 'react';
import http from '../lib/http';

const Filter = Object.freeze({
  All: 'All',
  PendingApproval: 'Pending approval',
  Approved: 'Approved',
});

const StatusPill = ({ status }) => {
  const style = (() => {
    if (status === 'Approved') {
      return { bg: '#EAFAE7', fg: '#2E7D32' };
    }
    if (status === 'Pending approval') {
      return { bg: '#FFF4E5', fg: '#F57C00' };
    }
    if (status === 'Correction requested') {
      return { bg: '#FEE2E2', fg: '#B91C1C' };
    }
    return { bg: '#E5E7EB', fg: '#374151' };
  })();

  return (
    <span
      style={{
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.fg,
        display: 'inline-block',
      }}
    >
      {status}
    </span>
  );
};

const Timesheets = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(Filter.All);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [actionFeedback, setActionFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTimesheets = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await http.get('/timesheets');
        const list = Array.isArray(data?.items || data) ? data.items || data : [];
        const mapped = list.map((t) => {
          const checkIn = t.checkInTime || t.checkIn || t.startTime;
          const checkOut = t.checkOutTime || t.checkOut || t.endTime;
          let totalHours = t.totalHours;
          if (!totalHours && checkIn && checkOut) {
            const start = new Date(checkIn);
            const end = new Date(checkOut);
            if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
              totalHours = Number(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2));
            }
          }
          return {
            id: t._id,
            guardName: t.guardName || t.guard?.fullName || 'Guard',
            role: t.role || t.shiftTitle || t.shift?.title || 'Security Guard',
            date: t.date || t.shiftDate,
            checkIn,
            checkOut,
            totalHours: totalHours ?? '--',
            expectedHours: t.expectedHours,
            location: t.locationLabel || t.location || t.site || '--',
            hourlyRate: t.hourlyRate ?? t.payRate ?? t.rate,
            status: mapStatus(t.status),
          };
        });
        setItems(mapped);
      } catch (err) {
        const message = err?.response?.data?.message || 'Error fetching timesheets.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchTimesheets();
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedFilter === Filter.All) return items;
    if (selectedFilter === Filter.PendingApproval) {
      return items.filter((i) => i.status === 'Pending approval');
    }
    if (selectedFilter === Filter.Approved) {
      return items.filter((i) => i.status === 'Approved');
    }
    return items;
  }, [items, selectedFilter]);

  const totals = useMemo(() => {
    const total = items.length;
    const pending = items.filter((i) => i.status === 'Pending approval').length;
    const approved = items.filter((i) => i.status === 'Approved').length;
    return { total, pending, approved };
  }, [items]);

  const getAlert = (t) => {
    if (!t.expectedHours || typeof t.totalHours !== 'number') return null;
    const diff = t.totalHours - t.expectedHours;
    if (diff < -0.25) {
      return { type: 'Underworked', tone: 'warning', text: `${Math.abs(diff).toFixed(2)}h under` };
    }
    if (diff > 0.25) {
      return { type: 'Overtime', tone: 'success', text: `${diff.toFixed(2)}h over` };
    }
    return null;
  };

  const formatTime = (value) => {
    if (!value) return '--';
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    }
    return value;
  };

  const formatDate = (value) => {
    if (!value) return '--';
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return value;
  };

  const handleApprove = async () => {
    if (!selectedTimesheet) return;
    setSubmitting(true);
    setActionFeedback('');
    try {
      await http.post(`/timesheets/${selectedTimesheet.id}/approve`);
      setItems((prev) =>
        prev.map((i) => (i.id === selectedTimesheet.id ? { ...i, status: 'Approved' } : i)),
      );
      setSelectedTimesheet((prev) => (prev ? { ...prev, status: 'Approved' } : prev));
      setActionFeedback('Timesheet approved.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Error approving timesheet.';
      setActionFeedback(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!selectedTimesheet) return;
    setSubmitting(true);
    setActionFeedback('');
    try {
      await http.post(`/timesheets/${selectedTimesheet.id}/request-correction`);
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedTimesheet.id ? { ...i, status: 'Correction requested' } : i,
        ),
      );
      setSelectedTimesheet((prev) =>
        prev ? { ...prev, status: 'Correction requested' } : prev,
      );
      setActionFeedback('Correction requested from guard.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Error requesting correction.';
      setActionFeedback(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageContainer}>
      <div style={pageHeader}>
        <h1 style={pageTitle}>Timesheets</h1>
      </div>

      <div style={summaryRow}>
        <SummaryCard label="Total timesheets" value={totals.total} tone="default" />
        <SummaryCard label="Pending approval" value={totals.pending} tone="warning" />
        <SummaryCard label="Approved" value={totals.approved} tone="success" />
      </div>

      <div style={toolbarRow}>
        <div style={filterGroup}>
          <span style={filterLabel}>Filter by:</span>
          <div style={filterChips}>
            {Object.values(Filter).map((f) => (
              <button
                key={f}
                type="button"
                style={selectedFilter === f ? filterChipActive : filterChip}
                onClick={() => setSelectedFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <p>Loading timesheets...</p>}
      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
      {!loading && !error && filteredItems.length === 0 && (
        <p style={{ marginTop: 8 }}>No timesheets to show.</p>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <div style={grid}>
          {filteredItems.map((t) => {
            const alert = getAlert(t);
            return (
              <div
                key={t.id}
                style={card}
                onClick={() => setSelectedTimesheet(t)}
              >
                <div style={cardTop}>
                  <div>
                    <div style={pillRow}>
                      <StatusPill status={t.status} />
                    </div>
                    <h3 style={cardTitle}>{t.role}</h3>
                    <p style={cardMeta}>{t.guardName}</p>
                  </div>
                  <div style={cardAmount}>
                    {typeof t.hourlyRate === 'number' ? (
                      <>
                        <span style={amountMain}>${t.hourlyRate}</span>
                        <span style={amountSub}>/hr</span>
                      </>
                    ) : (
                      <span style={amountSub}>Rate N/A</span>
                    )}
                  </div>
                </div>

                <div style={cardBody}>
                  <p style={cardLocation}>{t.location}</p>
                  <div style={inlineRow}>
                    <span style={inlineLabel}>Date</span>
                    <span style={inlineValue}>{formatDate(t.date)}</span>
                  </div>
                  <div style={inlineRow}>
                    <span style={inlineLabel}>Check-in</span>
                    <span style={inlineValue}>{formatTime(t.checkIn)}</span>
                  </div>
                  <div style={inlineRow}>
                    <span style={inlineLabel}>Check-out</span>
                    <span style={inlineValue}>{formatTime(t.checkOut)}</span>
                  </div>
                  <div style={inlineRow}>
                    <span style={inlineLabel}>Total hours</span>
                    <span style={inlineValue}>
                      {typeof t.totalHours === 'number' ? `${t.totalHours} h` : '--'}
                    </span>
                  </div>
                  {alert && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '6px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor:
                          alert.tone === 'warning' ? '#FFF4E5' : '#EAFAE7',
                        color: alert.tone === 'warning' ? '#C05621' : '#166534',
                        display: 'inline-flex',
                        gap: 6,
                      }}
                    >
                      <span>{alert.type}</span>
                      <span>•</span>
                      <span>{alert.text}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTimesheet && (
        <TimesheetDetailModal
          timesheet={selectedTimesheet}
          onClose={() => {
            setSelectedTimesheet(null);
            setActionFeedback('');
          }}
          onApprove={handleApprove}
          onRequestCorrection={handleRequestCorrection}
          submitting={submitting}
          feedback={actionFeedback}
          formatDate={formatDate}
          formatTime={formatTime}
          getAlert={getAlert}
        />
      )}
    </div>
  );
};

const TimesheetDetailModal = ({
  timesheet,
  onClose,
  onApprove,
  onRequestCorrection,
  submitting,
  feedback,
  formatDate,
  formatTime,
  getAlert,
}) => {
  const alert = getAlert(timesheet);
  return (
    <div style={detailOverlay} onClick={onClose}>
      <div style={detailCard} onClick={(e) => e.stopPropagation()}>
        <header style={detailHeader}>
          <div>
            <p style={detailOverline}>Secure Shift</p>
            <h2 style={detailTitle}>Timesheet Details</h2>
            <p style={detailSubtitle}>
              Review attendance, confirm hours and approve or request correction.
            </p>
          </div>
          <button type="button" style={detailClose} onClick={onClose}>
            ×
          </button>
        </header>

        {feedback && <div style={detailFeedback}>{feedback}</div>}

        <section style={detailGrid}>
          <div style={detailColumn}>
            <h3 style={detailSectionTitle}>Shift summary</h3>
            <div style={detailRow}>
              <span style={detailLabel}>Guard</span>
              <span style={detailValue}>{timesheet.guardName}</span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>Role</span>
              <span style={detailValue}>{timesheet.role}</span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>Date</span>
              <span style={detailValue}>{formatDate(timesheet.date)}</span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>Location</span>
              <span style={detailValue}>{timesheet.location}</span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>Status</span>
              <span style={detailValue}>
                <StatusPill status={timesheet.status} />
              </span>
            </div>
          </div>

          <div style={detailColumn}>
            <h3 style={detailSectionTitle}>Attendance</h3>
            <div style={detailRow}>
              <span style={detailLabel}>Check-in</span>
              <span style={detailValue}>{formatTime(timesheet.checkIn)}</span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>Check-out</span>
              <span style={detailValue}>{formatTime(timesheet.checkOut)}</span>
            </div>
            <div style={detailRow}>
              <span style={detailLabel}>Total hours</span>
              <span style={detailValue}>
                {typeof timesheet.totalHours === 'number'
                  ? `${timesheet.totalHours} h`
                  : '--'}
              </span>
            </div>
            {typeof timesheet.expectedHours === 'number' && (
              <div style={detailRow}>
                <span style={detailLabel}>Scheduled hours</span>
                <span style={detailValue}>{timesheet.expectedHours} h</span>
              </div>
            )}
            {alert && (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    backgroundColor:
                      alert.tone === 'warning' ? '#FFF4E5' : '#EAFAE7',
                    color: alert.tone === 'warning' ? '#9A3412' : '#166534',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {alert.type}: {alert.text}
                </div>
              </div>
            )}
          </div>
        </section>

        <footer style={detailFooter}>
          <button
            type="button"
            style={secondaryAction}
            onClick={onRequestCorrection}
            disabled={submitting}
          >
            Request correction
          </button>
          <button
            type="button"
            style={primaryAction}
            onClick={onApprove}
            disabled={submitting}
          >
            {submitting ? 'Processing...' : 'Approve timesheet'}
          </button>
        </footer>
      </div>
    </div>
  );
};

const mapStatus = (raw) => {
  if (!raw) return 'Pending approval';
  const value = String(raw).toLowerCase();
  if (value.includes('approve')) return 'Approved';
  if (value.includes('correction') || value.includes('reject')) {
    return 'Correction requested';
  }
  return 'Pending approval';
};

const SummaryCard = ({ label, value, tone }) => {
  const toneStyle =
    tone === 'success'
      ? { bg: '#EAFAE7', fg: '#166534' }
      : tone === 'warning'
      ? { bg: '#FFF4E5', fg: '#9A3412' }
      : { bg: '#EFF4FF', fg: '#1E293B' };
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '18px 22px',
        backgroundColor: toneStyle.bg,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 14, color: '#475569' }}>{label}</span>
      <span style={{ fontSize: 24, fontWeight: 700, color: toneStyle.fg }}>
        {value}
      </span>
    </div>
  );
};

const pageContainer = {
  padding: '40px',
  minHeight: '100vh',
  maxWidth: '1200px',
  margin: '0 auto',
};

const pageHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
};

const pageTitle = {
  fontSize: 28,
  fontWeight: 700,
  margin: 0,
  color: '#1f2937',
};

const summaryRow = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
  marginBottom: 24,
};

const toolbarRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
  flexWrap: 'wrap',
  gap: 12,
};

const filterGroup = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const filterLabel = {
  fontSize: 14,
  color: '#4b5563',
};

const filterChips = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const filterChip = {
  borderRadius: 999,
  padding: '6px 14px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  fontSize: 14,
  color: '#4b5563',
};

const filterChipActive = {
  ...filterChip,
  backgroundColor: '#274b93',
  borderColor: '#274b93',
  color: '#ffffff',
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 20,
  marginTop: 8,
};

const card = {
  backgroundColor: '#ffffff',
  borderRadius: 12,
  padding: 18,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  cursor: 'pointer',
};

const cardTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
};

const cardTitle = {
  margin: '8px 0 2px',
  fontSize: 18,
  fontWeight: 600,
  color: '#111827',
};

const cardMeta = {
  margin: 0,
  fontSize: 14,
  color: '#6b7280',
};

const pillRow = {
  display: 'flex',
  justifyContent: 'flex-start',
};

const cardAmount = {
  textAlign: 'right',
  minWidth: 64,
};

const amountMain = {
  fontSize: 20,
  fontWeight: 700,
  color: '#15803d',
};

const amountSub = {
  fontSize: 12,
  color: '#6b7280',
  display: 'block',
};

const cardBody = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const cardLocation = {
  fontSize: 13,
  color: '#4b5563',
  margin: '0 0 6px',
};

const inlineRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 13,
};

const inlineLabel = {
  color: '#6b7280',
};

const inlineValue = {
  color: '#111827',
  fontWeight: 500,
};

const detailOverlay = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1100,
  padding: 20,
};

const detailCard = {
  backgroundColor: '#ffffff',
  borderRadius: 14,
  maxWidth: 960,
  width: '100%',
  padding: '28px 32px 24px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
};

const detailHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
  marginBottom: 12,
};

const detailOverline = {
  margin: 0,
  color: '#6b7280',
  fontSize: 12,
  letterSpacing: 0.4,
  fontWeight: 600,
};

const detailTitle = {
  margin: '4px 0',
  fontSize: 22,
  fontWeight: 700,
  color: '#111827',
};

const detailSubtitle = {
  margin: 0,
  fontSize: 14,
  color: '#6b7280',
};

const detailClose = {
  backgroundColor: '#f3f4f6',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  width: 36,
  height: 36,
  fontSize: 22,
  cursor: 'pointer',
  color: '#374151',
};

const detailFeedback = {
  marginTop: 10,
  marginBottom: 10,
  padding: '8px 10px',
  borderRadius: 10,
  backgroundColor: '#f1f5f9',
  color: '#0f172a',
  fontSize: 13,
  border: '1px solid #e2e8f0',
};

const detailGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 18,
  marginTop: 12,
};

const detailColumn = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const detailSectionTitle = {
  fontSize: 15,
  fontWeight: 600,
  color: '#111827',
  margin: '0 0 6px',
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 14,
  padding: '4px 0',
};

const detailLabel = {
  color: '#6b7280',
};

const detailValue = {
  color: '#111827',
  fontWeight: 500,
  marginLeft: 12,
  textAlign: 'right',
};

const detailFooter = {
  marginTop: 20,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
};

const primaryAction = {
  backgroundColor: '#274b93',
  color: '#ffffff',
  borderRadius: 20,
  border: 'none',
  padding: '10px 22px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryAction = {
  backgroundColor: '#ffffff',
  color: '#b91c1c',
  borderRadius: 20,
  border: '1px solid #b91c1c',
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export default Timesheets;



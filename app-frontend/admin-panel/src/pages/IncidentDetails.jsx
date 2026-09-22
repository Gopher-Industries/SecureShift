import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getIncident, updateIncident } from '../service/adminAPI';
import { useToast } from '../components/Toast';
import Button from '../components/Button';
import LoadingComponent from '../components/LoadingComponent';
import colors from '../theme/colors';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

const nextStatus = {
  SUBMITTED: 'IN_REVIEW',
  IN_REVIEW: 'RESOLVED',
  RESOLVED: null,
};

const statusLabel = {
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In Review',
  RESOLVED: 'Resolved',
};

const row = {
  display: 'flex',
  gap: 8,
  padding: '10px 0',
  borderBottom: `1px solid ${colors.border}`,
};
const label = { width: 140, color: colors.muted, fontWeight: 600 };

export default function IncidentDetails() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError('');
        setNotFound(false);

        const data = await getIncident(id);
        if (mounted) setIncident(data.data || data);
      } catch (err) {
        if (!mounted) return;
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(err?.response?.data?.message || 'Failed to load incident');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleAdvanceStatus = async () => {
    const target = nextStatus[incident.status];
    if (!target) return;

    try {
      setUpdating(true);
      const data = await updateIncident(id, { status: target });
      setIncident(data.data || data);
      showToast(`Incident marked as ${statusLabel[target]}.`, 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update incident status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <h1>Incident Details</h1>
      <p style={{ marginTop: -8 }}>
        <Link to="/incidents" style={{ color: colors.primary }}>
          &larr; Back to Incidents
        </Link>
      </p>

      {loading ? (
        <LoadingComponent />
      ) : notFound ? (
        <p style={{ color: colors.danger }}>Incident not found.</p>
      ) : (
        <>
          {error ? <p style={{ color: colors.danger }}>{error}</p> : null}
          {incident ? (
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: 16,
                maxWidth: 560,
              }}
            >
              <div style={row}>
                <span style={label}>Guard</span>
                <span>{incident.guardId?.name || incident.guardId || '—'}</span>
              </div>
              <div style={row}>
                <span style={label}>Shift</span>
                <span>{incident.shiftId?._id || incident.shiftId || '—'}</span>
              </div>
              <div style={row}>
                <span style={label}>Severity</span>
                <span>{incident.severity}</span>
              </div>
              <div style={row}>
                <span style={label}>Status</span>
                <span>{statusLabel[incident.status] || incident.status}</span>
              </div>
              <div style={row}>
                <span style={label}>Description</span>
                <span>{incident.description}</span>
              </div>
              <div style={row}>
                <span style={label}>Location</span>
                <span>
                  {incident.location?.latitude !== undefined
                    ? `${incident.location.latitude}, ${incident.location.longitude}`
                    : '—'}
                </span>
              </div>
              <div style={row}>
                <span style={label}>Recorded</span>
                <span>{formatDate(incident.recordedAt)}</span>
              </div>
              <div style={{ ...row, borderBottom: 'none' }}>
                <span style={label}>Attachments</span>
                <span>{incident.attachments?.length || 0}</span>
              </div>

              {nextStatus[incident.status] ? (
                <Button onClick={handleAdvanceStatus} disabled={updating} style={{ marginTop: 16 }}>
                  {updating ? 'Updating…' : `Mark as ${statusLabel[nextStatus[incident.status]]}`}
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

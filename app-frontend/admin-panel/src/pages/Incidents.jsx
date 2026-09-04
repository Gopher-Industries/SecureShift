import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../service/adminAPI';
import DataTable from '../components/DataTable';
import LoadingComponent from '../components/LoadingComponent';
import SearchFilter from '../components/SearchFilter';
import colors from '../theme/colors';

const ui = {
  toolbar: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  select: {
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    padding: '8px 12px',
    fontSize: 14,
    background: colors.white,
    color: colors.text,
    cursor: 'pointer',
    marginBottom: 16,
  },
};

const severityBadge = {
  low: colors.success,
  medium: colors.warning,
  high: colors.danger,
};

const statusLabel = {
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In Review',
  RESOLVED: 'Resolved',
};

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError('');

        const params = {};
        if (severityFilter) params.severity = severityFilter;
        if (statusFilter) params.status = statusFilter;

        const data = await getIncidents(params);
        const list = Array.isArray(data) ? data : data.data || data.incidents || [];

        if (mounted) setIncidents(list);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || 'Failed to load incidents');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [severityFilter, statusFilter]);

  const filtered = incidents.filter((i) => {
    if (!query) return true;
    const guardName = i.guardId?.name || '';
    const shiftLabel = i.shiftId?._id || i.shiftId || '';
    return `${guardName} ${i.description} ${shiftLabel}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  const columns = [
    {
      key: 'description',
      header: 'Incident',
      render: (r) => (
        <Link to={`/incidents/${r._id}`} style={{ color: colors.primary }}>
          {r.description?.length > 60 ? `${r.description.slice(0, 60)}…` : r.description}
        </Link>
      ),
    },
    {
      key: 'guard',
      header: 'Guard',
      render: (r) => r.guardId?.name || r.guardId || '—',
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (r) => (
        <span style={{ color: severityBadge[r.severity] || colors.text, fontWeight: 600 }}>
          {r.severity}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => statusLabel[r.status] || r.status,
    },
    {
      key: 'recordedAt',
      header: 'Recorded',
      render: (r) => (r.recordedAt ? new Date(r.recordedAt).toLocaleString() : '—'),
    },
  ];

  return (
    <div>
      <h1>Incident Oversight</h1>

      <div style={{ ...ui.toolbar }}>
        <SearchFilter
          value={query}
          onChange={setQuery}
          placeholder="Search by guard or description…"
        />

        <select
          style={ui.select}
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          style={ui.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {loading ? (
        <LoadingComponent />
      ) : error ? (
        <p style={{ color: colors.danger }}>{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          empty={
            query || severityFilter || statusFilter
              ? 'No incidents match your search or filter'
              : 'No incidents found'
          }
        />
      )}
    </div>
  );
}

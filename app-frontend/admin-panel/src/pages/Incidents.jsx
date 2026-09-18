import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

const INCIDENT_SORT_KEYS = ['description', 'guard', 'severity', 'status', 'recordedAt'];

function parsePage(value) {
  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseSort(searchParams) {
  const key = searchParams.get('sort');

  if (!INCIDENT_SORT_KEYS.includes(key)) {
    return { key: null, direction: 'asc' };
  }

  return {
    key,
    direction: searchParams.get('dir') === 'desc' ? 'desc' : 'asc',
  };
}

export default function Incidents() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [severityFilter, setSeverityFilter] = useState(
    () => searchParams.get('severity') || ''
  );
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');
  const [sortConfig, setSortConfig] = useState(() => parseSort(searchParams));
  const [page, setPage] = useState(() => parsePage(searchParams.get('page')));

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setSeverityFilter(searchParams.get('severity') || '');
    setStatusFilter(searchParams.get('status') || '');
    setSortConfig(parseSort(searchParams));
    setPage(parsePage(searchParams.get('page')));
  }, [searchParams]);

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

  const updateTableUrl = (updates) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        Object.entries(updates).forEach(([key, value]) => {
          if (value === '' || value === null || value === undefined) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });

        return next;
      },
      { replace: true }
    );
  };

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
        <span
          style={{
            color: severityBadge[r.severity] || colors.text,
            fontWeight: 600,
          }}
        >
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
          onChange={(value) => {
            setQuery(value);
            setPage(1);

            updateTableUrl({
              q: value,
              page: null,
            });
          }}
          placeholder="Search by guard or description…"
        />

        <select
          style={ui.select}
          value={severityFilter}
          onChange={(e) => {
            const value = e.target.value;

            setSeverityFilter(value);
            setPage(1);

            updateTableUrl({
              severity: value,
              page: null,
            });
          }}
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          style={ui.select}
          value={statusFilter}
          onChange={(e) => {
            const value = e.target.value;

            setStatusFilter(value);
            setPage(1);

            updateTableUrl({
              status: value,
              page: null,
            });
          }}
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
          controlledSortConfig={sortConfig}
          onSortChange={(nextSort) => {
            setSortConfig(nextSort);
            setPage(1);

            updateTableUrl({
              sort: nextSort.key,
              dir: nextSort.direction,
              page: null,
            });
          }}
          controlledPage={page}
          onPageChange={(nextPage) => {
            setPage(nextPage);

            updateTableUrl({
              page: nextPage > 1 ? nextPage : null,
            });
          }}
        />
      )}
    </div>
  );
}

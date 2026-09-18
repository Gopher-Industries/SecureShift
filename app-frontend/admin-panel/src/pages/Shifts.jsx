import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getShifts } from '../service/adminAPI';
import DataTable from '../components/DataTable';
import LoadingComponent from '../components/LoadingComponent';
import SearchFilter from '../components/SearchFilter';

// List of status options for the filter
const STATUS_OPTIONS = ['draft', 'open', 'applied', 'assigned', 'completed'];

// Number of shifts shown per page
const PAGE_SIZE = 20;

// Columns that can be sorted by DataTable
const SHIFT_SORT_KEYS = ['title', 'date', 'times', 'status', 'employer', 'guard'];

// Format the shift date
function formatDate(d) {
  if (!d) return '\u2014';

  const parsed = new Date(d);

  return Number.isNaN(parsed.getTime()) ? '\u2014' : parsed.toLocaleDateString();
}

// Format the shift start and end times
function formatTimes(r) {
  if (!r.startTime && !r.endTime) return '\u2014';

  return `${r.startTime || '\u2014'} \u2013 ${r.endTime || '\u2014'}`;
}

// Show a person's name or email if no name exists
function personLabel(person) {
  if (!person) return '\u2014';

  return person.name || person.email || '\u2014';
}

function parsePage(value) {
  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseSort(searchParams) {
  const key = searchParams.get('sort');

  if (!SHIFT_SORT_KEYS.includes(key)) {
    return { key: null, direction: 'asc' };
  }

  return {
    key,
    direction: searchParams.get('dir') === 'desc' ? 'desc' : 'asc',
  };
}

// Read-only admin oversight of all shifts
export default function Shifts() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [sortConfig, setSortConfig] = useState(() => parseSort(searchParams));
  const [page, setPage] = useState(() => parsePage(searchParams.get('page')));

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setStatus(searchParams.get('status') || '');
    setSortConfig(parseSort(searchParams));
    setPage(parsePage(searchParams.get('page')));
  }, [searchParams]);

  // Load all shifts when the page opens
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError('');

        // Get shifts from the backend
        const data = await getShifts();
        const list = Array.isArray(data) ? data : data.shifts || data.data || [];

        if (mounted) setShifts(list);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || 'Failed to load shifts');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

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

  // Filter shifts by search text and status
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return shifts.filter((s) => {
      if (status && s.status !== status) return false;
      if (!q) return true;

      const haystack = [
        s.title,
        s.status,
        personLabel(s.createdBy),
        s.createdBy?.email,
        personLabel(s.acceptedBy),
        s.acceptedBy?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [shifts, query, status]);

  // Column shown in the table
  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
    { key: 'times', header: 'Time', render: (r) => formatTimes(r) },
    { key: 'status', header: 'Status' },
    { key: 'employer', header: 'Employer', render: (r) => personLabel(r.createdBy) },
    { key: 'guard', header: 'Guard', render: (r) => personLabel(r.acceptedBy) },
  ];

  // Display the admin shifts page
  return (
    <div>
      <h1>Shifts</h1>
      <p style={{ color: '#777', marginTop: -8 }}>Read-only oversight of all shifts.</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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
          placeholder={'Search title, employer, guard\u2026'}
        />

        <select
          value={status}
          onChange={(e) => {
            const value = e.target.value;

            setStatus(value);
            setPage(1);

            updateTableUrl({
              status: value,
              page: null,
            });
          }}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: 4,
            marginBottom: 16,
          }}
        >
          <option value="">All statuses</option>

          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/*NEW: Show result count */}
      <p style={{ color: '#666', fontSize: '0.9rem', marginTop: 8 }}>
        Showing {filtered.length} {filtered.length === 1 ? 'shift' : 'shifts'}
      </p>

      {loading ? (
        <LoadingComponent label={'Loading shifts…'} />
      ) : error ? (
        <p style={{ color: '#c00' }}>{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          empty="No shifts found"
          pageSize={PAGE_SIZE}
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

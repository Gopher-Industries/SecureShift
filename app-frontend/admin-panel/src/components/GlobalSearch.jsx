import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, getShifts } from '../service/adminAPI';
import useDebouncedValue from '../hooks/useDebouncedValue';
import colors from '../theme/colors';

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS_PER_GROUP = 5;

function personLabel(person) {
  if (!person) return '';
  return person.name || person.email || '';
}

function matches(haystackParts, query) {
  const haystack = haystackParts.filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query);
}

// Cross-entity search. Aggregates existing list
// endpoints client-side until a dedicated /admin/search endpoints exists.
export default function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [raw, setRaw] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState({ users: [], guards: [], shifts: [] });

  const query = useDebouncedValue(raw.trim(), 300);

  // Close the dropdown on outside click.
  useEffect(() => {
    function handleClickOutside(ev) {
      if (containerRef.current && !containerRef.current.contains(ev.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setResults({ users: [], guards: [], shifts: [] });
      setLoading(false);
      setError('');
      return;
    }

    let active = true;
    const q = query.toLowerCase();

    (async () => {
      try {
        setLoading(true);
        setError('');

        const [usersResult, shiftsResult] = await Promise.allSettled([getUsers(), getShifts()]);

        if (!active) return;

        const usersData =
          usersResult.status === 'fulfilled'
            ? Array.isArray(usersResult.value)
              ? usersResult.value
              : usersResult.value.users || usersResult.value.data || []
            : [];

        const shiftsData =
          shiftsResult.status === 'fulfilled'
            ? Array.isArray(shiftsResult.value)
              ? shiftsResult.value
              : shiftsResult.value.shifts || shiftsResult.value.data || []
            : [];

        const matchedUsers = usersData
          .filter((u) => u.role !== 'guard')
          .filter((u) => matches([u.name, u.email, u._id], q))
          .slice(0, MAX_RESULTS_PER_GROUP);

        const matchedGuards = usersData
          .filter((u) => u.role === 'guard')
          .filter((u) => matches([u.name, u.email, u._id], q))
          .slice(0, MAX_RESULTS_PER_GROUP);

        const matchedShifts = shiftsData
          .filter((s) =>
            matches(
              [s.title, s.status, s._id, personLabel(s.createdBy), personLabel(s.acceptedBy)],
              q
            )
          )
          .slice(0, MAX_RESULTS_PER_GROUP);

        setResults({ users: matchedUsers, guards: matchedGuards, shifts: matchedShifts });

        if (usersResult.status === 'rejected' && shiftsResult.status === 'rejected') {
          setError('Search is unavailable right now.');
        }
      } catch {
        if (active) setError('Search is unavailable right now.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [query]);

  const hasAnyResults =
    results.users.length > 0 || results.guards.length > 0 || results.shifts.length > 0;

  const showDropdown = open && query.length >= MIN_QUERY_LENGTH;

  const groups = useMemo(
    () => [
      { key: 'users', label: 'Users', items: results.users },
      { key: 'guards', label: 'Guards', items: results.guards },
      { key: 'shifts', label: 'Shifts', items: results.shifts },
    ],
    [results]
  );

  function goToPerson(person) {
    setOpen(false);
    setRaw('');
    navigate(`/users/${person._id}`);
  }

  function goToShift(shift) {
    setOpen(false);
    setRaw('');
    // No shift detail page yet, so deep-link into the filtered shifts list.
    navigate(`/shifts?q=${encodeURIComponent(shift.title || shift._id)}`);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: 320 }}>
      <input
        type="search"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Search users, guards, shifts…"
        aria-label="Global search"
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid ${colors.border}`,
          borderRadius: 6,
          fontSize: 14,
          outline: 'none',
        }}
      />

      {showDropdown && (
        <div
          role="listbox"
          aria-label="Search results"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(16,24,40,0.12)',
            maxHeight: 360,
            overflowY: 'auto',
            zIndex: 20,
          }}
        >
          {loading && (
            <div style={{ padding: '10px 12px', color: colors.muted, fontSize: 14 }}>
              Searching…
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: '10px 12px', color: colors.danger, fontSize: 14 }}>{error}</div>
          )}

          {!loading && !error && !hasAnyResults && (
            <div style={{ padding: '10px 12px', color: colors.muted, fontSize: 14 }}>
              No matches for &quot{query}&quot;
            </div>
          )}

          {!loading &&
            !error &&
            groups.map(
              (group) =>
                group.items.length > 0 && (
                  <div key={group.key}>
                    <div
                      style={{
                        padding: '6px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                        color: colors.muted,
                        background: colors.tableHead,
                      }}
                    >
                      {group.label}
                    </div>

                    {group.items.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        role="option"
                        aria-selected="false"
                        onClick={() =>
                          group.key === 'shifts' ? goToShift(item) : goToPerson(item)
                        }
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: colors.text,
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {group.key === 'shifts' ? (
                          <>
                            <div>{item.title || 'Untitled shift'}</div>
                            <div style={{ fontSize: 12, color: colors.muted }}>{item.status}</div>
                          </>
                        ) : (
                          <>
                            <div>{item.name}</div>
                            <div style={{ fontSize: 12, color: colors.muted }}>{item.email}</div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                )
            )}
        </div>
      )}
    </div>
  );
}

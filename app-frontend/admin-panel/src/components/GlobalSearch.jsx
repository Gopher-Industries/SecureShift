import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useEntitySearch from '../hooks/useEntitySearch';
import { useTheme } from '../theme/ThemeProvider';

const MIN_QUERY_LENGTH = 2;

// Cross-entity search input. Fetch/match logic lives in useEntitySearch,
// shared with the Command Palette (AP-057).
export default function GlobalSearch() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [raw, setRaw] = useState('');
  const [open, setOpen] = useState(false);

  const { results, loading, error, query } = useEntitySearch(raw);

  useEffect(() => {
    function handleClickOutside(ev) {
      if (containerRef.current && !containerRef.current.contains(ev.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasAnyResults =
    results.users.length > 0 ||
    results.guards.length > 0 ||
    results.shifts.length > 0 ||
    results.incidents.length > 0;

  const showDropdown = open && query.length >= MIN_QUERY_LENGTH;

  const groups = useMemo(
    () => [
      { key: 'users', label: 'Users', items: results.users },
      { key: 'guards', label: 'Guards', items: results.guards },
      { key: 'shifts', label: 'Shifts', items: results.shifts },
      { key: 'incidents', label: 'Incidents', items: results.incidents },
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
    navigate(`/shifts?q=${encodeURIComponent(shift.title || shift._id)}`);
  }

  function goToIncident(incident) {
    setOpen(false);
    setRaw('');
    navigate(`/incidents?q=${encodeURIComponent(incident.title || incident._id)}`);
  }

  function goToItem(group, item) {
    if (group === 'shifts') return goToShift(item);
    if (group === 'incidents') return goToIncident(item);
    return goToPerson(item);
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
              No matches for &quot;{query}&quot;
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
                        onClick={() => goToItem(group.key, item)}
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
                        {group.key === 'shifts' || group.key === 'incidents' ? (
                          <>
                            <div>{item.title || 'Untitled'}</div>
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

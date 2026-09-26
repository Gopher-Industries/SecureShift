import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useEntitySearch from '../hooks/useEntitySearch';
import { useTheme } from '../theme/ThemeProvider';

const MIN_QUERY_LENGTH = 2;

// AP-057: Cmd/Ctrl-K command palette. Jump-to-page entries are static and
// filtered client-side; entity search reuses useEntitySearch (shared with
// GlobalSearch, AP-039) so the fetch/match logic isn't duplicated.
const PAGES = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Users', path: '/users' },
  { label: 'Guard Verification', path: '/guard-verification' },
  { label: 'Shifts', path: '/shifts' },
  { label: 'Roles & Permissions', path: '/roles' },
  { label: 'Audit Logs', path: '/audit-logs' },
  { label: 'Messages', path: '/messages' },
  { label: 'Incidents', path: '/incidents' },
  { label: 'Announcements', path: '/announcements' },
  { label: 'SMTP Settings', path: '/smtp-settings' },
];

export default function CommandPalette() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { results, loading } = useEntitySearch(raw);

  // Global Cmd/Ctrl-K to open, Escape to close (even when the input isn't focused).
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const modifierPressed = isMac ? e.metaKey : e.ctrlKey;
      if (modifierPressed && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [open]);

  // Reset and focus the input whenever the palette opens.
  useEffect(() => {
    if (open) {
      setRaw('');
      setSelectedIndex(0);
      // Wait a tick so the input exists before focusing.
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const pageMatches = useMemo(() => {
    const q = raw.trim().toLowerCase();
    if (!q) return PAGES;
    return PAGES.filter((p) => p.label.toLowerCase().includes(q));
  }, [raw]);

  const showEntityResults = raw.trim().length >= MIN_QUERY_LENGTH;

  // Flatten everything visible into one list so arrow keys move through
  // pages and entity results as a single sequence.
  const flatItems = useMemo(() => {
    const items = pageMatches.map((p) => ({ type: 'page', label: p.label, path: p.path }));
    if (showEntityResults) {
      results.users.forEach((u) =>
        items.push({ type: 'user', label: u.name || u.email, subLabel: u.email, id: u._id })
      );
      results.guards.forEach((g) =>
        items.push({ type: 'guard', label: g.name || g.email, subLabel: g.email, id: g._id })
      );
      results.shifts.forEach((s) =>
        items.push({
          type: 'shift',
          label: s.title || 'Untitled shift',
          subLabel: s.status,
          id: s._id,
        })
      );
      results.incidents.forEach((i) =>
        items.push({
          type: 'incident',
          label: i.title || 'Untitled incident',
          subLabel: i.status,
          id: i._id,
        })
      );
    }
    return items;
  }, [pageMatches, results, showEntityResults]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [flatItems.length]);

  function activate(item) {
    if (!item) return;
    setOpen(false);
    if (item.type === 'page') navigate(item.path);
    else if (item.type === 'user' || item.type === 'guard') navigate(`/users/${item.id}`);
    else if (item.type === 'shift') navigate(`/shifts?q=${encodeURIComponent(item.label)}`);
    else if (item.type === 'incident') navigate(`/incidents?q=${encodeURIComponent(item.label)}`);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      activate(flatItems[selectedIndex]);
    }
  }

  // Keep the highlighted item scrolled into view as selection moves.
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const typeLabel = {
    page: 'Go to',
    user: 'User',
    guard: 'Guard',
    shift: 'Shift',
    incident: 'Incident',
  };

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        zIndex: 200,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        style={{
          width: 560,
          maxWidth: '90vw',
          background: colors.white,
          borderRadius: 10,
          boxShadow: '0 12px 32px rgba(16,24,40,0.25)',
          overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Jump to a page or search users, shifts, incidents…"
          aria-label="Command palette input"
          aria-controls="command-palette-list"
          aria-activedescendant={flatItems.length ? `cp-item-${selectedIndex}` : undefined}
          style={{
            width: '100%',
            padding: '16px 18px',
            fontSize: 16,
            border: 'none',
            borderBottom: `1px solid ${colors.border}`,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <div
          id="command-palette-list"
          ref={listRef}
          role="listbox"
          aria-label="Command palette results"
          style={{ maxHeight: '50vh', overflowY: 'auto' }}
        >
          {loading && showEntityResults && (
            <div style={{ padding: '10px 18px', color: colors.muted, fontSize: 13 }}>
              Searching…
            </div>
          )}

          {flatItems.length === 0 && (
            <div style={{ padding: '14px 18px', color: colors.muted, fontSize: 14 }}>
              No matches.
            </div>
          )}

          {flatItems.map((item, index) => (
            <div
              key={`${item.type}-${item.id || item.path}`}
              id={`cp-item-${index}`}
              data-index={index}
              role="option"
              tabIndex="-1"
              aria-selected={index === selectedIndex}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                activate(item);
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 18px',
                cursor: 'pointer',
                background: index === selectedIndex ? colors.tableHead : 'transparent',
              }}
            >
              <div>
                <div style={{ fontSize: 14, color: colors.text }}>{item.label}</div>
                {item.subLabel && (
                  <div style={{ fontSize: 12, color: colors.muted }}>{item.subLabel}</div>
                )}
              </div>
              <span style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>
                {typeLabel[item.type]}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '8px 18px',
            fontSize: 12,
            color: colors.muted,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            gap: 16,
          }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}

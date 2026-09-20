import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotificationFeed from '../hooks/useNotificationFeed';
import colors from '../theme/colors';

const styles = {
  wrapper: {
    position: 'relative',
  },
  bellButton: {
    position: 'relative',
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    padding: 6,
    color: '#18284f',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    background: colors.danger || '#d92d20',
    color: '#fff',
    borderRadius: '999px',
    fontSize: 11,
    fontWeight: 700,
    minWidth: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },
  dropdown: {
    position: 'absolute',
    top: '130%',
    right: 0,
    width: 340,
    maxHeight: 420,
    overflowY: 'auto',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 1000,
  },
  groupHeader: {
    padding: '10px 14px 4px',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  item: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '10px 14px',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    fontSize: 14,
    color: '#18284f',
  },
  emptyState: {
    padding: '24px 14px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
};

export default function NotificationBell() {
  const { feed, totalCount, loading } = useNotificationFeed();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const hasNothingPending = totalCount === 0;

  return (
    <div style={styles.wrapper} ref={wrapperRef}>
      <button
        style={styles.bellButton}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        🔔
        {totalCount > 0 && <span style={styles.badge}>{totalCount > 99 ? '99+' : totalCount}</span>}
      </button>

      {open && (
        <div style={styles.dropdown} role="menu">
          {loading && <div style={styles.emptyState}>Loading…</div>}

          {!loading && hasNothingPending && (
            <div style={styles.emptyState}>Nothing needs your attention right now.</div>
          )}

          {!loading && feed.verifications.length > 0 && (
            <>
              <div style={styles.groupHeader}>
                Pending Verifications ({feed.verifications.length})
              </div>
              {feed.verifications.slice(0, 5).map((g) => (
                <button key={g.id} style={styles.item} onClick={() => goTo('/guard-verification')}>
                  {g.name || g.email} — license pending review
                </button>
              ))}
            </>
          )}

          {!loading && feed.incidents.length > 0 && (
            <>
              <div style={styles.groupHeader}>Unresolved Incidents ({feed.incidents.length})</div>
              {feed.incidents.slice(0, 5).map((i) => (
                <button key={i._id} style={styles.item} onClick={() => goTo(`/incidents/${i._id}`)}>
                  {i.severity?.toUpperCase()} — {(i.description || '').slice(0, 40)}
                  {i.description?.length > 40 ? '…' : ''}
                </button>
              ))}
            </>
          )}

          {!loading && feed.unreadMessages > 0 && (
            <>
              <div style={styles.groupHeader}>Messages</div>
              <button style={styles.item} onClick={() => goTo('/messages')}>
                {feed.unreadMessages} unread message{feed.unreadMessages > 1 ? 's' : ''}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

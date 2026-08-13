import colors from '../theme/colors';

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '48px 24px',
    color: colors.muted,
  },
  icon: { fontSize: 36, marginBottom: 12 },
  title: { color: colors.text, fontSize: 16, fontWeight: 600, margin: '0 0 4px' },
  message: { color: colors.muted, fontSize: 13, margin: 0, maxWidth: 360 },
  action: { marginTop: 16 },
  actionButton: {
    background: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

// Placeholder shown instead of a blank table/list when there's no data
// (e.g. "No users found", "No shifts scheduled") or when a search/filter
// returns nothing.
//
// Usage:
//   <EmptyState title="No users found" message="Try adjusting your filters." />
//   <EmptyState title="No branches yet" actionLabel="Add branch" onAction={openCreateForm} />
export default function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div style={styles.wrap}>
      <div style={styles.icon}>{icon}</div>
      <p style={styles.title}>{title}</p>
      {message && <p style={styles.message}>{message}</p>}
      {actionLabel && onAction && (
        <div style={styles.action}>
          <button type="button" style={styles.actionButton} onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
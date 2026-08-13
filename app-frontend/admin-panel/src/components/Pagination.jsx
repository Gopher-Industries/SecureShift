import colors from '../theme/colors';

const styles = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    fontSize: 13,
    color: colors.muted,
  },
  controls: { display: 'flex', alignItems: 'center', gap: 8 },
  button: {
    background: colors.white,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  pageInfo: { color: colors.text, fontWeight: 600 },
};

// Reusable pager for table/list pages (Users, Audit Logs, Shifts, etc.).
// Parent owns the current page state; this component is presentational
// and just calls onPageChange with the next page number.
//
// Usage:
//   <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
export default function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }) {
  if (!totalPages || totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const rangeLabel =
    totalItems != null && pageSize != null
      ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalItems)} of ${totalItems}`
      : null;

  return (
    <div style={styles.wrap}>
      {rangeLabel && <span>{rangeLabel}</span>}
      <div style={styles.controls}>
        <button
          type="button"
          style={{ ...styles.button, ...(canPrev ? {} : styles.buttonDisabled) }}
          disabled={!canPrev}
          onClick={() => canPrev && onPageChange(page - 1)}
        >
          ← Previous
        </button>
        <span style={styles.pageInfo}>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          style={{ ...styles.button, ...(canNext ? {} : styles.buttonDisabled) }}
          disabled={!canNext}
          onClick={() => canNext && onPageChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
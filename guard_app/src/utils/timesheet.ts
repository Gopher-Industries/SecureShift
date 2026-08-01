export function formatTimesheetDateTime(value?: string | null) {
  if (!value) return '—';
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleString();
}

export function formatShiftDate(value?: string | null) {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatHours(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '—';
}

// rounds the same way the backend does so the totals line up
export function sumHours(values: (number | null | undefined)[]) {
  const total = values.reduce<number>(
    (sum, value) => sum + (typeof value === 'number' && Number.isFinite(value) ? value : 0),
    0,
  );

  return Math.round((total + Number.EPSILON) * 100) / 100;
}

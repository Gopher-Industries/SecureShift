import type { ShiftDto } from '../api/shifts';

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

// same as formatShiftDate but with a weekday, for the "Title • Date • Time" row label
function formatShiftLabelDate(value?: string | null) {
  if (!value) return '';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatShiftTimeRange(startTime?: string | null, endTime?: string | null) {
  if (startTime && endTime) return `${startTime} – ${endTime}`;
  return startTime || endTime || '';
}

// builds "Title • Date • Time" from a shift, falling back to the raw id when the
// shift can't be resolved (e.g. the guard's shift list hasn't loaded it)
export function fmtShiftLabel(shift: ShiftDto | undefined, shiftId: string) {
  if (!shift) return `Shift ID: ${shiftId}`;

  const parts = [
    shift.title?.trim(),
    formatShiftLabelDate(shift.date),
    formatShiftTimeRange(shift.startTime, shift.endTime),
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(' • ') : `Shift ID: ${shiftId}`;
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

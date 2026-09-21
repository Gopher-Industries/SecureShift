// Pure helpers for the Payroll & Timesheet Oversight page (AP-060).
// No React / no I/O, so they are easy to unit test.
import colors from '../theme/colors';

export const PAYROLL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PROCESSED: 'PROCESSED',
};

export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0.00';
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatHours(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0 h';
  return `${Number(n.toFixed(2))} h`;
}

export function formatPeriod(start, end) {
  const fmt = (d) => {
    const date = new Date(d);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };
  if (!start && !end) return '—';
  return `${fmt(start)} – ${fmt(end)}`;
}

// Visual metadata for a payroll status badge.
export function statusMeta(status) {
  switch (status) {
    case PAYROLL_STATUS.APPROVED:
      return { label: 'Approved', color: colors.primary };
    case PAYROLL_STATUS.PROCESSED:
      return { label: 'Processed', color: colors.success };
    case PAYROLL_STATUS.PENDING:
    default:
      return { label: 'Pending', color: colors.warning };
  }
}

// A pending record can be approved; an approved record can be processed.
export const canApprove = (row) => row?.status === PAYROLL_STATUS.PENDING;
export const canProcess = (row) => row?.status === PAYROLL_STATUS.APPROVED;

// Ids of the selected rows eligible for each action.
export const approvableIds = (rows = []) => rows.filter(canApprove).map((r) => r.id);
export const processableIds = (rows = []) => rows.filter(canProcess).map((r) => r.id);

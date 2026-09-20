import {
  approvableIds,
  canApprove,
  canProcess,
  formatHours,
  formatMoney,
  formatPeriod,
  processableIds,
  statusMeta,
} from './payroll';

describe('payroll utils', () => {
  it('formats money and hours', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50');
    expect(formatMoney(undefined)).toBe('$0.00');
    expect(formatHours(8.25)).toBe('8.25 h');
    expect(formatHours(null)).toBe('0 h');
  });

  it('formats a period range', () => {
    expect(formatPeriod('2026-09-01', '2026-09-07')).toMatch(/Sep.*2026/);
    expect(formatPeriod(null, null)).toBe('—');
  });

  it('maps status to a label', () => {
    expect(statusMeta('PENDING').label).toBe('Pending');
    expect(statusMeta('APPROVED').label).toBe('Approved');
    expect(statusMeta('PROCESSED').label).toBe('Processed');
  });

  it('gates approve/process by status', () => {
    expect(canApprove({ status: 'PENDING' })).toBe(true);
    expect(canApprove({ status: 'APPROVED' })).toBe(false);
    expect(canProcess({ status: 'APPROVED' })).toBe(true);
    expect(canProcess({ status: 'PROCESSED' })).toBe(false);
  });

  it('picks only eligible ids for each action', () => {
    const rows = [
      { id: 'a', status: 'PENDING' },
      { id: 'b', status: 'APPROVED' },
      { id: 'c', status: 'PROCESSED' },
    ];
    expect(approvableIds(rows)).toEqual(['a']);
    expect(processableIds(rows)).toEqual(['b']);
  });
});

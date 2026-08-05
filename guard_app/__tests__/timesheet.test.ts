/* eslint-env jest */

import { fmtShiftLabel } from '../src/utils/timesheet';

import type { ShiftDto } from '../src/api/shifts';

const baseShift: ShiftDto = {
  _id: 'shift-1',
  title: 'Night Guard',
  date: '2026-08-01',
  startTime: '22:00',
  endTime: '06:00',
};

// mirrors the date formatting fmtShiftLabel uses internally, so the expectation
// isn't tied to the test runner's locale
const expectedDate = new Date(baseShift.date).toLocaleDateString(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

describe('fmtShiftLabel', () => {
  it('builds a Title • Date • Time label from a full shift', () => {
    expect(fmtShiftLabel(baseShift, baseShift._id)).toBe(`Night Guard • ${expectedDate} • 22:00 – 06:00`);
  });

  it('falls back to the raw id when the shift is unresolved', () => {
    expect(fmtShiftLabel(undefined, 'abc123')).toBe('Shift ID: abc123');
  });

  it('omits a missing title but keeps date and time', () => {
    const shift = { ...baseShift, title: '' };
    expect(fmtShiftLabel(shift, shift._id)).toBe(`${expectedDate} • 22:00 – 06:00`);
  });

  it('omits a missing date but keeps title and time', () => {
    const shift = { ...baseShift, date: '' };
    expect(fmtShiftLabel(shift, shift._id)).toBe('Night Guard • 22:00 – 06:00');
  });

  it('shows only the start time when the end time is missing', () => {
    const shift = { ...baseShift, endTime: '' };
    expect(fmtShiftLabel(shift, shift._id)).toBe(`Night Guard • ${expectedDate} • 22:00`);
  });

  it('falls back to the raw id when every field is missing', () => {
    const shift = { ...baseShift, title: '', date: '', startTime: '', endTime: '' };
    expect(fmtShiftLabel(shift, 'shift-1')).toBe('Shift ID: shift-1');
  });
});

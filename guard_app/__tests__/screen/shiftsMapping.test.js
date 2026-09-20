/* eslint-env jest */

import { mapAllShifts, mapCompleted, mapMineShifts } from '../../src/screen/ShiftsScreen';

const MY_UID = 'guard-1';
const OTHER_UID = 'guard-2';

function makeShift(overrides = {}) {
  return {
    _id: 's1',
    title: 'Night Patrol',
    date: '2026-01-10',
    startTime: '18:00',
    endTime: '02:00',
    status: 'open',
    payRate: 45,
    createdBy: { _id: 'c1', company: 'Acme Security' },
    location: { suburb: 'Docklands', state: 'VIC' },
    applicants: [],
    ...overrides,
  };
}

describe('ShiftsScreen mapping helpers (API mocked at the data layer)', () => {
  describe('mapAllShifts', () => {
    it('marks an open shift with no applicants as Available', () => {
      const [row] = mapAllShifts([makeShift()], MY_UID);
      expect(row.status).toBe('Available');
      expect(row.company).toBe('Acme Security');
      expect(row.site).toBe('Docklands VIC');
      expect(row.rate).toBe('$45/hour');
    });

    it('marks a shift the guard applied to as Pending', () => {
      const [row] = mapAllShifts(
        [makeShift({ status: 'applied', applicants: [{ _id: MY_UID }] })],
        MY_UID,
      );
      expect(row.status).toBe('Pending');
    });

    it('marks a shift assigned to this guard as Confirmed', () => {
      const [row] = mapAllShifts(
        [makeShift({ status: 'assigned', acceptedBy: { _id: MY_UID } })],
        MY_UID,
      );
      expect(row.status).toBe('Confirmed');
    });

    it('marks a shift assigned to someone else as Available (not Confirmed for me)', () => {
      const [row] = mapAllShifts(
        [makeShift({ status: 'assigned', acceptedBy: { _id: OTHER_UID } })],
        MY_UID,
      );
      expect(row.status).toBe('Available');
    });

    it('excludes completed shifts', () => {
      const rows = mapAllShifts([makeShift({ status: 'completed' })], MY_UID);
      expect(rows).toHaveLength(0);
    });

    it('falls back to placeholders when company/pay/location are missing', () => {
      const [row] = mapAllShifts(
        [makeShift({ createdBy: undefined, payRate: undefined, location: undefined })],
        MY_UID,
      );
      expect(row.company).toBe('—');
      expect(row.rate).toBe('$—');
      expect(row.site).toBe('—');
    });
  });

  describe('mapMineShifts', () => {
    it('marks a shift assigned to me as Confirmed and attaches attendance', () => {
      const attendance = [
        {
          _id: 'a1',
          guardId: MY_UID,
          shiftId: 's1',
          checkInTime: '2026-01-10T18:05:00Z',
          checkOutTime: null,
          locationVerified: true,
        },
      ];

      const [row] = mapMineShifts(
        [makeShift({ status: 'assigned', acceptedBy: { _id: MY_UID } })],
        MY_UID,
        attendance,
      );

      expect(row.status).toBe('Confirmed');
      expect(row.attendance?.checkInTime).toBe('2026-01-10T18:05:00Z');
      expect(row.attendance?.checkOutTime).toBeUndefined();
    });

    it('marks a shift assigned to someone else (that I applied for) as Rejected', () => {
      const [row] = mapMineShifts(
        [
          makeShift({
            status: 'assigned',
            acceptedBy: { _id: OTHER_UID },
            applicants: [{ _id: MY_UID }],
          }),
        ],
        MY_UID,
      );
      expect(row.status).toBe('Rejected');
    });

    it('marks a shift still awaiting a decision as Pending', () => {
      const [row] = mapMineShifts([makeShift({ status: 'applied' })], MY_UID);
      expect(row.status).toBe('Pending');
    });

    it('excludes completed shifts', () => {
      const rows = mapMineShifts([makeShift({ status: 'completed' })], MY_UID);
      expect(rows).toHaveLength(0);
    });
  });

  describe('mapCompleted', () => {
    it('only includes completed shifts and marks them unrated', () => {
      const rows = mapCompleted([
        makeShift({ status: 'completed' }),
        makeShift({ _id: 's2', status: 'assigned' }),
      ]);

      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe('s1');
      expect(rows[0].rated).toBe(false);
      expect(rows[0].rating).toBe(0);
    });

    it('attaches matching attendance records by shift id', () => {
      const attendance = [
        {
          _id: 'a1',
          guardId: MY_UID,
          shiftId: 's1',
          checkInTime: '2026-01-10T18:00:00Z',
          checkOutTime: '2026-01-11T02:00:00Z',
          locationVerified: true,
        },
      ];

      const [row] = mapCompleted([makeShift({ status: 'completed' })], attendance);

      expect(row.attendance?.checkInTime).toBe('2026-01-10T18:00:00Z');
      expect(row.attendance?.checkOutTime).toBe('2026-01-11T02:00:00Z');
    });
  });
});

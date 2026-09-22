// Pure mappers from the shifts API DTO to the app's shift view models.
// Extracted from ShiftsScreen.tsx (GA-021) unchanged; re-exported there for
// backward compatibility. Unit-tested via __tests__/screen/shiftsMapping.test.js.

import { type Attendance } from '../api/attendance';
import { type ShiftDto } from '../api/shifts';

import type { AllShift, AppliedShift, CompletedShift } from '../models/Shifts';

export function mapMineShifts(
  shifts: ShiftDto[],
  myUid: string,
  attendanceRecords: Attendance[] = [],
): AppliedShift[] {
  return shifts
    .filter((s) => s.status !== 'completed')
    .map((s) => {
      const acceptedId =
        typeof s.acceptedBy === 'object' ? s.acceptedBy?._id : String(s.acceptedBy ?? '');

      const applicants = Array.isArray(s.applicants)
        ? s.applicants.map((a) => (typeof a === 'object' ? a._id : String(a)))
        : [];

      const attendance = attendanceRecords.find(
        (record) => String(record.shiftId) === String(s._id),
      );

      let status: AppliedShift['status'];
      if (s.status === 'assigned' && acceptedId === myUid) status = 'Confirmed';
      else if (s.status === 'assigned' && applicants.includes(myUid)) status = 'Rejected';
      else if (s.status === 'applied') status = 'Pending';

      return {
        id: s._id,
        title: s.title,
        company: s.createdBy?.company ?? '—',
        site: s.location ? `${s.location.suburb ?? ''} ${s.location.state ?? ''}`.trim() : '—',
        rate: typeof s.payRate === 'number' ? `$${s.payRate}/hour` : '$—',
        date: s.date,
        time: `${s.startTime} - ${s.endTime}`,
        status,
        attendance: attendance
          ? {
              checkInTime: attendance.checkInTime ?? undefined,
              checkOutTime: attendance.checkOutTime ?? undefined,
            }
          : undefined,
      };
    });
}

export function mapCompleted(
  shifts: ShiftDto[],
  attendanceRecords: Attendance[] = [],
): CompletedShift[] {
  return shifts
    .filter((s) => s.status === 'completed')
    .map((s) => {
      const attendance = attendanceRecords.find(
        (record) => String(record.shiftId) === String(s._id),
      );

      return {
        id: s._id,
        title: s.title,
        company: s.createdBy?.company ?? '—',
        site: s.location ? `${s.location.suburb ?? ''} ${s.location.state ?? ''}`.trim() : '—',
        rate: typeof s.payRate === 'number' ? `$${s.payRate}/hour` : '$—',
        date: s.date,
        time: `${s.startTime} - ${s.endTime}`,
        rated: s.ratedByGuard === true,
        rating: s.guardRating ?? 0,
        attendance: attendance
          ? {
              checkInTime: attendance.checkInTime ?? undefined,
              checkOutTime: attendance.checkOutTime ?? undefined,
            }
          : undefined,
      };
    });
}

export function mapAllShifts(shifts: ShiftDto[], myUid: string): AllShift[] {
  return shifts
    .filter((s) => s.status !== 'completed')
    .map((s) => {
      const acceptedId =
        typeof s.acceptedBy === 'object' ? s.acceptedBy?._id : String(s.acceptedBy ?? '');

      const applicants = Array.isArray(s.applicants)
        ? s.applicants.map((a) => (typeof a === 'object' ? a._id : String(a)))
        : [];

      let status: AllShift['status'] = 'Available';

      if (s.status === 'assigned' && acceptedId === myUid) status = 'Confirmed';
      else if (applicants.includes(myUid) || s.status === 'applied') status = 'Pending';

      return {
        id: s._id,
        title: s.title,
        company: s.createdBy?.company ?? '—',
        site: s.location ? `${s.location.suburb ?? ''} ${s.location.state ?? ''}`.trim() : '—',
        rate: typeof s.payRate === 'number' ? `$${s.payRate}/hour` : '$—',
        date: s.date,
        time: `${s.startTime} - ${s.endTime}`,
        status,
        detailedInstructions: s.detailedInstructions ?? s.description,
      };
    });
}

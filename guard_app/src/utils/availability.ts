import type { Availability } from '../api/availability';
import type { ShiftDto } from '../api/shifts';

function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}

export function shiftMatchesAvailability(
  shift: ShiftDto,
  availability: Availability | null,
): boolean {
  if (!availability) return true;

  const shiftDate = new Date(shift.date);
  const shiftDay = getDayName(shiftDate);

  if (!availability.days.includes(shiftDay)) {
    return false;
  }

  if (!shift.startTime || !shift.endTime) {
    return false;
  }

  return availability.timeSlots.some(slot => {
    const [slotStart, slotEnd] = slot.split('-');
    return timeRangesOverlap(shift.startTime!, shift.endTime!, slotStart, slotEnd);
  });
}



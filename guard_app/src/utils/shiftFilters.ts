// Pure search / filter / sort helpers for the Shifts "All" tab.
// Extracted verbatim from ShiftsScreen.tsx (GA-021) so the logic can be unit
// tested without rendering the screen. Behaviour is unchanged.

import type { AllShift } from '../models/Shifts';

export type StatusFilter = 'All' | 'Available' | 'Pending' | 'Confirmed';
export type DateFilter = 'all' | 'today' | 'week';
export type SortOption = 'dateAsc' | 'dateDesc' | 'payAsc' | 'payDesc';

export type ShiftFilterOptions = {
  q: string;
  statusFilter: StatusFilter;
  dateFilter: DateFilter;
  sortOption: SortOption;
};

/** Case-insensitive search over "title company site" (space-joined). */
export function matchesSearch(shift: Pick<AllShift, 'title' | 'company' | 'site'>, q: string) {
  return `${shift.title} ${shift.company} ${shift.site}`
    .toLowerCase()
    .includes(q.trim().toLowerCase());
}

function withinDateFilter(shift: AllShift, dateFilter: DateFilter, now: Date): boolean {
  if (dateFilter === 'all') return true;

  const shiftDate = new Date(shift.date);
  const today = new Date(now);

  shiftDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (dateFilter === 'today') {
    return shiftDate.getTime() === today.getTime();
  }

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  return shiftDate >= today && shiftDate <= endOfWeek;
}

function payValue(rate: string): number {
  return Number(rate.replace(/[^0-9.]/g, '')) || 0;
}

/**
 * Applies the search box, status chip, date chip and sort option to the All-tab
 * rows, in the same order the screen used. `now` is injectable for tests.
 */
export function filterAndSortAllShifts(
  rows: AllShift[],
  { q, statusFilter, dateFilter, sortOption }: ShiftFilterOptions,
  now: Date = new Date(),
): AllShift[] {
  return rows
    .filter((shift) => matchesSearch(shift, q))
    .filter((shift) => statusFilter === 'All' || shift.status === statusFilter)
    .filter((shift) => withinDateFilter(shift, dateFilter, now))
    .sort((a, b) => {
      if (sortOption === 'dateAsc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      if (sortOption === 'dateDesc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }

      const payA = payValue(a.rate);
      const payB = payValue(b.rate);

      return sortOption === 'payAsc' ? payA - payB : payB - payA;
    });
}

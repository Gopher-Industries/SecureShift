/* eslint-env jest */

import { matchesSearch, filterAndSortAllShifts } from '../../src/utils/shiftFilters';

const shift = (over) => ({
  id: over.id,
  title: over.title ?? 'Guard Shift',
  company: over.company ?? 'Acme',
  site: over.site ?? 'Docklands',
  rate: over.rate ?? '$40/hour',
  date: over.date,
  time: '18:00 - 02:00',
  status: over.status ?? 'Available',
});

const NOW = new Date('2026-03-10T12:00:00');

describe('matchesSearch', () => {
  it('matches case-insensitively across title/company/site', () => {
    const s = shift({ id: '1', title: 'Night Patrol', company: 'SecureCo', site: 'Adelaide' });
    expect(matchesSearch(s, 'night')).toBe(true);
    expect(matchesSearch(s, 'SECURECO')).toBe(true);
    expect(matchesSearch(s, 'adel')).toBe(true);
    expect(matchesSearch(s, 'sydney')).toBe(false);
  });

  it('treats blank/whitespace queries as match-all', () => {
    expect(matchesSearch(shift({ id: '1' }), '   ')).toBe(true);
  });
});

describe('filterAndSortAllShifts', () => {
  const rows = [
    shift({ id: 'a', title: 'Alpha', date: '2026-03-10', rate: '$50/hour', status: 'Available' }),
    shift({ id: 'b', title: 'Bravo', date: '2026-03-12', rate: '$30/hour', status: 'Pending' }),
    shift({ id: 'c', title: 'Charlie', date: '2026-04-20', rate: '$70/hour', status: 'Available' }),
  ];

  const base = { q: '', statusFilter: 'All', dateFilter: 'all', sortOption: 'dateAsc' };

  it('filters by status', () => {
    const out = filterAndSortAllShifts(rows, { ...base, statusFilter: 'Pending' }, NOW);
    expect(out.map((s) => s.id)).toEqual(['b']);
  });

  it('filters by search query', () => {
    const out = filterAndSortAllShifts(rows, { ...base, q: 'charlie' }, NOW);
    expect(out.map((s) => s.id)).toEqual(['c']);
  });

  it('date filter "today" keeps only shifts on the injected now', () => {
    const out = filterAndSortAllShifts(rows, { ...base, dateFilter: 'today' }, NOW);
    expect(out.map((s) => s.id)).toEqual(['a']);
  });

  it('date filter "week" keeps shifts within 7 days of now', () => {
    const out = filterAndSortAllShifts(rows, { ...base, dateFilter: 'week' }, NOW);
    expect(out.map((s) => s.id).sort()).toEqual(['a', 'b']);
  });

  it('sorts by date ascending and descending', () => {
    expect(
      filterAndSortAllShifts(rows, { ...base, sortOption: 'dateAsc' }, NOW).map((s) => s.id),
    ).toEqual(['a', 'b', 'c']);
    expect(
      filterAndSortAllShifts(rows, { ...base, sortOption: 'dateDesc' }, NOW).map((s) => s.id),
    ).toEqual(['c', 'b', 'a']);
  });

  it('sorts by pay ascending and descending (parsing $/hour)', () => {
    expect(
      filterAndSortAllShifts(rows, { ...base, sortOption: 'payAsc' }, NOW).map((s) => s.id),
    ).toEqual(['b', 'a', 'c']);
    expect(
      filterAndSortAllShifts(rows, { ...base, sortOption: 'payDesc' }, NOW).map((s) => s.id),
    ).toEqual(['c', 'a', 'b']);
  });
});

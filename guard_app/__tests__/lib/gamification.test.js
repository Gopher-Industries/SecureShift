/* eslint-env jest */

import {
  deriveBadges,
  deriveStreak,
  deriveLeaderboard,
  currentUserRank,
  EARNED_COUNT,
} from '../../src/lib/gamification';

const strongBreakdown = {
  punctuality: { score: 40, maxPoints: 40, onTimeCheckins: 10, totalCheckins: 10 },
  shiftCompletion: { score: 30, maxPoints: 30, completedShifts: 10, totalAssignedShifts: 10 },
  incidents: { score: 30, maxPoints: 30, high: 0, medium: 0, low: 0, deduction: 0 },
};

const weakBreakdown = {
  punctuality: { score: 10, maxPoints: 40, onTimeCheckins: 2, totalCheckins: 8 },
  shiftCompletion: { score: 10, maxPoints: 30, completedShifts: 3, totalAssignedShifts: 8 },
  incidents: { score: 5, maxPoints: 30, high: 1, medium: 1, low: 0, deduction: 25 },
};

describe('deriveBadges', () => {
  it('awards achievement badges for a strong score', () => {
    const badges = deriveBadges(95, strongBreakdown);
    const earned = badges.filter((b) => b.earned).map((b) => b.id);
    expect(earned).toEqual(
      expect.arrayContaining([
        'rising_star',
        'top_performer',
        'punctual_pro',
        'reliable',
        'incident_free',
        'streak_7',
      ]),
    );
    expect(EARNED_COUNT(badges)).toBe(badges.length);
  });

  it('locks badges with progress (never negative/over 1) for a weak score', () => {
    const badges = deriveBadges(30, weakBreakdown);
    expect(badges.find((b) => b.id === 'top_performer').earned).toBe(false);
    expect(badges.find((b) => b.id === 'incident_free').earned).toBe(false);
    badges.forEach((b) => {
      expect(b.progress).toBeGreaterThanOrEqual(0);
      expect(b.progress).toBeLessThanOrEqual(1);
    });
  });
});

describe('deriveStreak', () => {
  it('seeds the streak from punctuality data', () => {
    const streak = deriveStreak(strongBreakdown);
    expect(streak.current).toBe(10);
    expect(streak.best).toBeGreaterThanOrEqual(streak.current);
    expect(streak.onTimeThisMonth).toBe(10);
  });
});

describe('deriveLeaderboard (opt-in + anonymised)', () => {
  it('returns null when the guard has not opted in', () => {
    expect(deriveLeaderboard(80, false)).toBeNull();
  });

  it('ranks the guard among anonymised peers when opted in', () => {
    const board = deriveLeaderboard(100, true); // top score
    expect(board).not.toBeNull();
    // ranks are contiguous and sorted by score desc
    expect(board[0].isCurrentUser).toBe(true);
    expect(board[0].rank).toBe(1);
    for (let i = 1; i < board.length; i += 1) {
      expect(board[i].score).toBeLessThanOrEqual(board[i - 1].score);
      expect(board[i].rank).toBe(i + 1);
    }
    // exactly one current-user row; peers are not flagged as the user
    expect(board.filter((e) => e.isCurrentUser)).toHaveLength(1);
    expect(currentUserRank(board)).toBe(1);
  });

  it('places a low score near the bottom', () => {
    const board = deriveLeaderboard(10, true);
    expect(currentUserRank(board)).toBe(board.length);
  });
});

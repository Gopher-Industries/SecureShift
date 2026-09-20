// GA-033 — guard gamification (badges, streaks, leaderboard) layered on the
// existing guard score. Pure, deterministic derivations so the UI can be unit
// tested. All progression is seeded from the real GuardScore; peer/leaderboard
// data is mock (see gamificationMock.ts) until a backend adds it.

import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { GuardScoreBreakdown } from '../api/guardScore';
import { LEADERBOARD_PEERS } from './gamificationMock';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type Badge = {
  id: string;
  titleKey: string;
  descKey: string;
  icon: IoniconName;
  earned: boolean;
  /** 0..1 progress toward earning (1 when earned). */
  progress: number;
};

export type Streak = {
  current: number;
  best: number;
  onTimeThisMonth: number;
};

export type LeaderboardEntry = {
  rank: number;
  /** Anonymised label — never a real name for peers. */
  label: string;
  score: number;
  isCurrentUser: boolean;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function ratio(part: number, total: number): number {
  return total > 0 ? part / total : 0;
}

/**
 * Badges are positive-only: an unearned badge shows progress toward a goal,
 * never a penalty. Everything is derived from the guard score breakdown.
 */
export function deriveBadges(score: number, breakdown: GuardScoreBreakdown): Badge[] {
  const punctualRatio = ratio(
    breakdown.punctuality.onTimeCheckins,
    breakdown.punctuality.totalCheckins,
  );
  const completionRatio = ratio(
    breakdown.shiftCompletion.completedShifts,
    breakdown.shiftCompletion.totalAssignedShifts,
  );
  const incidentTotal =
    breakdown.incidents.high + breakdown.incidents.medium + breakdown.incidents.low;
  const hasShifts = breakdown.shiftCompletion.totalAssignedShifts > 0;
  const streak = deriveStreak(breakdown);

  return [
    {
      id: 'rising_star',
      titleKey: 'gamification.badgeRisingStar',
      descKey: 'gamification.badgeRisingStarDesc',
      icon: 'trending-up-outline',
      earned: score >= 50,
      progress: clamp01(score / 50),
    },
    {
      id: 'top_performer',
      titleKey: 'gamification.badgeTopPerformer',
      descKey: 'gamification.badgeTopPerformerDesc',
      icon: 'trophy-outline',
      earned: score >= 85,
      progress: clamp01(score / 85),
    },
    {
      id: 'punctual_pro',
      titleKey: 'gamification.badgePunctualPro',
      descKey: 'gamification.badgePunctualProDesc',
      icon: 'time-outline',
      earned: breakdown.punctuality.totalCheckins >= 5 && punctualRatio >= 0.9,
      progress: clamp01(punctualRatio),
    },
    {
      id: 'reliable',
      titleKey: 'gamification.badgeReliable',
      descKey: 'gamification.badgeReliableDesc',
      icon: 'shield-checkmark-outline',
      earned: breakdown.shiftCompletion.totalAssignedShifts >= 5 && completionRatio >= 0.9,
      progress: clamp01(completionRatio),
    },
    {
      id: 'incident_free',
      titleKey: 'gamification.badgeIncidentFree',
      descKey: 'gamification.badgeIncidentFreeDesc',
      icon: 'checkmark-done-outline',
      earned: hasShifts && incidentTotal === 0,
      progress: hasShifts && incidentTotal === 0 ? 1 : 0,
    },
    {
      id: 'streak_7',
      titleKey: 'gamification.badgeStreak7',
      descKey: 'gamification.badgeStreak7Desc',
      icon: 'flame-outline',
      earned: streak.current >= 7,
      progress: clamp01(streak.current / 7),
    },
  ];
}

/**
 * Streak seeded from punctuality data (the closest real signal we have until a
 * dedicated streak field exists). Deterministic so tests and the UI agree.
 */
export function deriveStreak(breakdown: GuardScoreBreakdown): Streak {
  const onTime = breakdown.punctuality.onTimeCheckins;
  const total = breakdown.punctuality.totalCheckins;
  return {
    current: onTime,
    best: Math.max(onTime, Math.round(total * 0.8)),
    onTimeThisMonth: onTime,
  };
}

export const EARNED_COUNT = (badges: Badge[]) => badges.filter((b) => b.earned).length;

/**
 * Anonymised leaderboard: the current guard is inserted among mock peers, sorted
 * by score. Peers are always anonymous labels; only the current user is marked.
 * Returns null when the guard has not opted in (privacy — opt-in only).
 */
export function deriveLeaderboard(score: number, optedIn: boolean): LeaderboardEntry[] | null {
  if (!optedIn) return null;

  const rows = [
    ...LEADERBOARD_PEERS.map((p) => ({ label: p.label, score: p.score, isCurrentUser: false })),
    { label: 'gamification.you', score, isCurrentUser: true },
  ];

  rows.sort((a, b) => b.score - a.score);

  return rows.map((row, i) => ({
    rank: i + 1,
    label: row.label,
    score: row.score,
    isCurrentUser: row.isCurrentUser,
  }));
}

/** Convenience: the current user's rank (1-based) in the opted-in leaderboard. */
export function currentUserRank(entries: LeaderboardEntry[] | null): number | null {
  if (!entries) return null;
  const me = entries.find((e) => e.isCurrentUser);
  return me ? me.rank : null;
}

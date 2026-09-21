// GA-033 — isolated mock data for the gamification view.
// Kept in its own module so the mock/leaderboard peers are easy to find and
// delete once a real badges/streaks/leaderboard backend exists. Peers are
// anonymised by design (no real guard identities) to respect leaderboard privacy.

export type LeaderboardPeer = {
  /** Anonymous display label — deliberately not a real name. */
  label: string;
  score: number;
};

// Deterministic anonymised peers, so the leaderboard is stable across renders
// and tests. The current guard's real score is slotted in at runtime.
export const LEADERBOARD_PEERS: readonly LeaderboardPeer[] = [
  { label: 'Guard A7', score: 92 },
  { label: 'Guard C3', score: 84 },
  { label: 'Guard F9', score: 77 },
  { label: 'Guard K2', score: 69 },
  { label: 'Guard M5', score: 58 },
  { label: 'Guard R8', score: 46 },
] as const;

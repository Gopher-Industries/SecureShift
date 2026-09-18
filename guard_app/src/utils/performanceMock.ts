// Sample data for the My Performance screen.
// The guard score API does not send streaks or a trend yet, so these numbers are
// fixed here until a backend field is added. Nothing else in the app uses them.

export type TrendPoint = {
  label: string;
  score: number;
};

export const MOCK_STREAKS = {
  currentStreak: 4,
  bestStreak: 9,
  onTimeThisMonth: 6,
};

export const MOCK_TREND: TrendPoint[] = [
  { label: 'W1', score: 54 },
  { label: 'W2', score: 61 },
  { label: 'W3', score: 58 },
  { label: 'W4', score: 66 },
  { label: 'W5', score: 63 },
  { label: 'W6', score: 68 },
];

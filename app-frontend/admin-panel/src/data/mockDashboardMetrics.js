// Mock data for the admin dashboard trend charts.

const weekLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'];

export const mockSignups = weekLabels.map((label, i) => ({
  label,
  value: [12, 18, 15, 24, 21, 30][i],
}));

export const mockShiftsFilled = weekLabels.map((label, i) => ({
  label,
  value: [40, 52, 48, 61, 58, 70][i],
}));

export const mockVerificationBacklog = weekLabels.map((label, i) => ({
  label,
  value: [22, 19, 25, 17, 14, 9][i],
}));

export const mockDashboardMetrics = {
  signups: mockSignups,
  shiftsFilled: mockShiftsFilled,
  verificationBacklog: mockVerificationBacklog,
};

export default mockDashboardMetrics;

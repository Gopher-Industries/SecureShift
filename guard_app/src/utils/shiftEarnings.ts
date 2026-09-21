// Pure earnings/duration helpers for the Home dashboard.
// Extracted from HomeScreen.tsx (GA-021) unchanged.

export function minutesBetween(startHHMM: string, endHHMM: string): number {
  const [sh, sm] = startHHMM.split(':').map(Number);
  const [eh, em] = endHHMM.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  let duration = (end - start + 1440) % 1440;
  if (duration === 0) duration = 1440;
  return duration;
}

export function moneyForShift(s: {
  payRate?: number;
  startTime?: string;
  endTime?: string;
}): string | undefined {
  if (!s.payRate || !s.startTime || !s.endTime) return undefined;
  const hours = minutesBetween(s.startTime, s.endTime) / 60;
  return `$${(s.payRate * hours).toFixed(0)}`;
}

import type { AllShift } from '../models/Shifts';

// Adds recommendation details to a normal shift.
export type RecommendedShift = AllShift & {
  recommendationScore: number;
  recommendationReason: string;
};

// Mock guard preferences used only for GA-048.
// These can later be replaced by real recommendation data from the backend.
const MOCK_GUARD_PROFILE = {
  // Mock location preference.
  preferredLocations: ['North Adelaide', 'Adelaide'],

  // Mock history of shifts the guard has worked before.
  previousShiftTitles: ['Venue Entry Security', 'Office Lobby Security'],
};

// Converts pay rate text such as "$42/hour" into the number 42.
function getPayRate(rate: string): number {
  return Number(rate.replace(/[^0-9.]/g, '')) || 0;
}

// Returns a small ranked list of recommended available shifts.
export function getRecommendedShifts(shifts: AllShift[]): RecommendedShift[] {
  return (
    shifts
      // Availability:
      // Only shifts that are still available can be recommended.
      .filter((shift) => shift.status === 'Available')

      .map((shift) => {
        let recommendationScore = 0;
        const reasons: string[] = [];

        const shiftDate = new Date(shift.date);
        const today = new Date();

        const daysAway = Math.ceil((shiftDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Availability/timing:
        // Prioritise shifts happening within the next 7 days.
        if (daysAway >= 0 && daysAway <= 7) {
          recommendationScore += 2;
          reasons.push('available soon');
        }

        // Location:
        // Give extra points if the shift matches the guard's mock preferred location.
        if (
          MOCK_GUARD_PROFILE.preferredLocations.some((location) =>
            shift.site.toLowerCase().includes(location.toLowerCase()),
          )
        ) {
          recommendationScore += 2;
          reasons.push('preferred location');
        }

        // History:
        // Give extra points if the guard has mock history with a similar shift.
        if (
          MOCK_GUARD_PROFILE.previousShiftTitles.some(
            (title) => title.toLowerCase() === shift.title.toLowerCase(),
          )
        ) {
          recommendationScore += 2;
          reasons.push('similar to previous shifts');
        }

        // Extra ranking factor:
        // Higher-paying shifts receive one additional point.
        if (getPayRate(shift.rate) >= 40) {
          recommendationScore += 1;
          reasons.push('higher pay rate');
        }

        return {
          ...shift,
          recommendationScore,
          recommendationReason: reasons.length > 0 ? reasons.join(' • ') : 'Available shift',
        };
      })

      // Highest scoring shifts appear first.
      .sort((a, b) => b.recommendationScore - a.recommendationScore)

      // Keep the recommendation row small.
      .slice(0, 3)
  );
}

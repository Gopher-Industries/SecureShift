import axios from 'axios';
import http from '../lib/http';

type ScorePart = {
  score: number;
  maxPoints: number;
};

export type GuardScoreBreakdown = {
  punctuality: ScorePart & { onTimeCheckins: number; totalCheckins: number };
  shiftCompletion: ScorePart & { completedShifts: number; totalAssignedShifts: number };
  incidents: ScorePart & { high: number; medium: number; low: number; deduction: number };
};

// score and breakdown are missing when the guard has no shifts yet
export type GuardScore = {
  guardId: string;
  score: number | null;
  breakdown?: GuardScoreBreakdown;
};

export async function getGuardScore(guardId: string): Promise<GuardScore> {
  if (!guardId || guardId === 'undefined' || guardId === 'null') {
    throw new Error('Missing valid guardId for score request');
  }

  try {
    const response = await http.get<{
      success: boolean;
      data: GuardScore;
    }>(`/users/guards/${guardId}/score`);

    return response.data.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch guard score (${
        axios.isAxiosError(error) ? error.response?.status : 'unknown'
      })`,
    );
  }
}

export async function fetchGuardScore(guardId?: string): Promise<GuardScore | null> {
  if (!guardId) return null;

  try {
    return await getGuardScore(guardId);
  } catch {
    return null;
  }
}

import axios from 'axios';

import http from '../lib/http';

export type GuardScore = {
  guardId?: string;
  score?: number;
  rating?: number;
  performanceScore?: number;
  currentRating?: number;
  completedShifts?: number;
  totalShifts?: number;
  attendanceRate?: number;
  punctualityRate?: number;
  summary?: string;
  message?: string;
};

export async function getGuardScore(guardId: string): Promise<GuardScore> {
  if (!guardId || guardId === 'undefined' || guardId === 'null') {
    throw new Error('Missing valid guardId for score request');
  }

  try {
    const response = await http.get<{ success: boolean; data: GuardScore }>(
      `/users/guards/${guardId}/score`,
    );

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

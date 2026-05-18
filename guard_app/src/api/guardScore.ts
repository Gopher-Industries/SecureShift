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
      `/users/guards/${guardId}/score`
    );

    return response.data.data;
  } catch (error) {
    console.log('FULL SCORE ERROR:', error);

    if (axios.isAxiosError(error)) {
      console.log('STATUS:', error.response?.status);
      console.log('DATA:', error.response?.data);
    }

    throw new Error(
      `Failed to fetch guard score (${axios.isAxiosError(error) ? error.response?.status : 'unknown'
      })`,
    );
  }
}

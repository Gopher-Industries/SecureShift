import axios from 'axios';
import http from '../lib/http';

type ApiGuardScore = {
  guardId: string;
  score: number;
  breakdown: unknown; // exists in API, not in use
};

export type GuardScore = Pick<ApiGuardScore, 'guardId' | 'score'>;

export async function getGuardScore(guardId: string): Promise<GuardScore> {
  if (!guardId || guardId === 'undefined' || guardId === 'null') {
    throw new Error('Missing valid guardId for score request');
  }

  try {
    const response = await http.get<{
      success: boolean;
      data: ApiGuardScore;
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

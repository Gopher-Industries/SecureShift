/* eslint-disable @typescript-eslint/no-explicit-any */

import http from '../lib/http';

export interface AvailabilityData {
  userId: string;
  days: string[];
  timeSlots: string[];
}

interface AvailabilityResponse {
  availability?: {
    days?: string[];
    timeSlots?: string[];
  };
}

// GET /api/v1/availability/:userId
export const getAvailability = async (userId: string): Promise<AvailabilityData | null> => {
  try {
    const res = await http.get<AvailabilityResponse>(`/availability/${userId}`);

    return {
      userId,
      days: res.data.availability?.days ?? [],
      timeSlots: res.data.availability?.timeSlots ?? [],
    };
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      (err as any).response?.status === 404
    ) {
      return null;
    }
    throw err;
  }
};

// POST /api/v1/availability
export const upsertAvailability = async (
  payload: AvailabilityData,
): Promise<AvailabilityResponse> => {
  const res = await http.post<AvailabilityResponse>('/availability', payload);
  return res.data;
};

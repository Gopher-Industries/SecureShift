// src/api/availability.ts
import http from '../lib/http';

// Existing types (keep for backward compatibility)
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

// New types for calendar-based availability
export type AvailabilitySlotDto = {
  _id: string;
  guardId: string;
  date: string; // "2025-12-25" ISO date format
  fromTime: string; // "09:00"
  toTime: string; // "17:00"
  recurring?: {
    enabled: boolean;
    pattern: 'weekly' | 'daily';
    endDate?: string;
  };
  createdAt: string;
  updatedAt?: string;
};

type AvailabilitySlotListResponse =
  | AvailabilitySlotDto[]
  | { items?: AvailabilitySlotDto[] }
  | { data?: AvailabilitySlotDto[] }
  | { availability?: AvailabilitySlotDto[] };

type AvailabilitySlotResponse = {
  message?: string;
  availability?: AvailabilitySlotDto;
  data?: AvailabilitySlotDto;
};

// Utility to normalize array responses (same pattern as shifts.ts)
function toArray<T>(payload: AvailabilitySlotListResponse | any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as any)?.items)) return (payload as any).items;
  if (Array.isArray((payload as any)?.data)) return (payload as any).data;
  if (Array.isArray((payload as any)?.availability)) return (payload as any).availability;
  return [];
}

// ============================================================================
// EXISTING ENDPOINTS (keep for backward compatibility)
// ============================================================================

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

// ============================================================================
// NEW ENDPOINTS (for calendar-based availability management)
// ============================================================================

// POST /api/v1/availability/slots
export async function addAvailabilitySlot(params: {
  date: string;
  fromTime: string;
  toTime: string;
  recurring?: {
    enabled: boolean;
    pattern: 'weekly' | 'daily';
    endDate?: string;
  };
}) {
  const { data } = await http.post<AvailabilitySlotResponse>('/availability/slots', params);
  return data.availability || data.data || data;
}

// GET /api/v1/availability/slots/my-slots
export async function getMyAvailabilitySlots(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await http.get<AvailabilitySlotListResponse>('/availability/slots/my-slots', {
    params,
  });
  return toArray<AvailabilitySlotDto>(data);
}

// DELETE /api/v1/availability/slots/:id
export async function removeAvailabilitySlot(id: string) {
  const { data } = await http.delete(`/availability/slots/${id}`);
  return data;
}

// DELETE /api/v1/availability/slots/clear-all
export async function clearAllAvailabilitySlots() {
  const { data } = await http.delete('/availability/slots/clear-all');
  return data;
}

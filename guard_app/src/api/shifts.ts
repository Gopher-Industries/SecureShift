// src/api/shifts.ts
import http from '../lib/http';

export type ShiftDto = {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  company?: string;
  // backend may return mapped (guard) or raw (employer/admin)
  status?: 'open' | 'pending' | 'confirmed' | 'rejected' | 'completed';
  rate?: number;
  location?: {
    street?: string; suburb?: string; state?: string; postcode?: string;
  };
};

type ListResponse =
  | ShiftDto[]                                 // plain array
  | { items?: ShiftDto[] }                     // paginated { items }
  | { data?: ShiftDto[] }                      // alt { data }
  | { shifts?: ShiftDto[] };                   // alt { shifts }

type ApplyResponse = {
  message?: string;
  shift?: ShiftDto;
};

// small util
function toArray<T>(payload: ListResponse | any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as any)?.items)) return (payload as any).items;
  if (Array.isArray((payload as any)?.data)) return (payload as any).data;
  if (Array.isArray((payload as any)?.shifts)) return (payload as any).shifts;
  return [];
}

// GET /api/v1/shifts
export async function listShifts(page = 1, limit = 20) {
  const { data } = await http.get('/shifts', { params: { page, limit } });
  return {
    items: toArray<ShiftDto>(data),
    page: data.page ?? page,
    limit: data.limit ?? limit,
    total: data.total ?? (toArray<ShiftDto>(data).length),
  };
}

// GET /api/v1/shifts/myshifts   (?status=past optional)
export async function myShifts(status?: 'past') {
  const { data } = await http.get<ListResponse>('/shifts/myshifts', {
    params: status ? { status } : undefined,
  });
  return toArray<ShiftDto>(data);
}

// PUT /api/v1/shifts/:id/apply
export async function applyToShift(id: string) {
  const { data } = await http.put<ApplyResponse>(`/shifts/${id}/apply`);
  return data; // { message, shift }
}

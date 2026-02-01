/* eslint-disable @typescript-eslint/no-explicit-any */

// src/api/shifts.ts
import http from '../lib/http';

export type ShiftDto = {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;

  createdBy?: {
    _id: string;
    name?: string;
    email?: string;
    company?: string;
  };

  // backend states (keep only what backend supports)
  status?: 'open' | 'applied' | 'assigned' | 'completed';

  payRate?: number;

  location?: {
    street?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
  };

  applicants?: { _id: string; name?: string; email?: string }[];
  acceptedBy?: { _id: string; name?: string; email?: string };
};

type ListResponse =
  | ShiftDto[]
  | { items?: ShiftDto[] }
  | { data?: ShiftDto[] }
  | { shifts?: ShiftDto[] };

type ApplyResponse = {
  message?: string;
  shift?: ShiftDto;
};

function toArray<T>(payload: ListResponse | any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.shifts)) return payload.shifts;
  return [];
}

// GET /api/v1/shifts
export async function listShifts(page = 1, limit = 20) {
  const { data } = await http.get('/shifts', { params: { page, limit } });

  const items = toArray<ShiftDto>(data);

  return {
    items,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    total: data?.total ?? items.length,
  };
}

// GET /api/v1/shifts/myshifts (?status=past optional)
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

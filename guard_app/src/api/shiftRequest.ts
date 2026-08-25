// src/api/shift.ts

import http from '../lib/http';

export type ShiftRequestDto = {
  _id: string;
  type: 'SWAP' | 'LEAVE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestingGuardId: string;
  targetGuardId?: string;
  originalShiftId: string;
  leaveStartDate?: Date;
  leaveEndDate?: Date;
  reason: string;
  rejectionReason?: string;
  createdAt?: Date;
};

export interface CreateShiftRequestPayload {
  type: 'SWAP' | 'LEAVE';
  targetGuardId: string | null;
  originalShiftId: string;
  replacementShiftId: string | null;
  leaveStartDate: Date | null;
  leaveEndDate: Date | null;
  reason: string;
}

export interface SwapOptionsResponse {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: {
    street: string;
  };
  description: string;
  acceptedBy: {
    id: string;
    name: string;
  };
  payRate: number;
}

type ListResponse =
  | ShiftRequestDto[]
  | { items?: ShiftRequestDto[] }
  | { data?: ShiftRequestDto[] };

function toArray<T>(payload: ListResponse | any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

//GET /api/v1/shift-requests
export async function listShiftRequests(page = 1, limit = 20) {
  const { data } = await http.get('shift-requests', { params: { page, limit } });

  const items = toArray<ShiftRequestDto>(data);

  return {
    items,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    total: data?.total ?? items.length,
    success: data.success,
  };
}

//POST /api/v1/shift-requests
export async function createShiftRequest(payload: CreateShiftRequestPayload) {
  const { data } = await http.post<ShiftRequestDto>('shift-requests', payload);
  return data;
}

//GET api/v1/shift-requests/swap-options/:id
export async function getSwapableShifts(shiftID: string) {
  const { data } = await http.get(`shift-requests/swap-options/${shiftID}`);
  return data.data;
}

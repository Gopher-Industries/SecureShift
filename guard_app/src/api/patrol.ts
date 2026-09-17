// Patrol / Guard-Tour API client (GA-034, app-side).
//
// Defines the endpoint contract the backend is expected to implement and the
// domain types the app uses. Because the backend patrol endpoints do not exist
// yet, this client falls back to a deterministic dev mock so the whole flow is
// demoable now; when the real endpoints land, set EXPO_PUBLIC_PATROL_API=live
// to hit them.
//
// Expected backend contract (v1):
//   GET  /api/v1/shifts/:shiftId/checkpoints        -> Checkpoint[] | { items }
//   POST /api/v1/shifts/:shiftId/patrol/scan        -> { scan: CheckpointScan }
//        body: { checkpointId, code, latitude, longitude, timestamp }
import axios from 'axios';

import http from '../lib/http';

export type Checkpoint = {
  id: string;
  shiftId: string;
  name: string;
  // Position of this checkpoint in the tour (1-based).
  order: number;
  // Expected QR payload the guard must scan at this checkpoint.
  code: string;
  latitude: number;
  longitude: number;
  // How close (metres) the guard must be for a scan to count.
  radiusMeters: number;
};

export type CheckpointScan = {
  checkpointId: string;
  scannedAt: string; // ISO timestamp
  latitude: number;
  longitude: number;
};

// Live mode only when explicitly enabled; defaults to mock until the backend
// ships the patrol endpoints.
const USE_MOCK = process.env.EXPO_PUBLIC_PATROL_API !== 'live';

// ---- Dev mock ---------------------------------------------------------------
// Four checkpoints clustered around a base coordinate (Adelaide CBD by default,
// matching the seed demo shift) so a single GPS override covers the tour while
// distinct QR codes distinguish each checkpoint.
const MOCK_BASE = { latitude: -34.9285, longitude: 138.6007 };

export function getMockCheckpoints(shiftId: string): Checkpoint[] {
  const defs: Array<Omit<Checkpoint, 'shiftId' | 'radiusMeters'>> = [
    { id: 'cp-01', order: 1, name: 'Main Entrance', code: 'SS-CP-01', ...offset(0, 0) },
    { id: 'cp-02', order: 2, name: 'Loading Dock', code: 'SS-CP-02', ...offset(0.0004, 0) },
    { id: 'cp-03', order: 3, name: 'Perimeter North', code: 'SS-CP-03', ...offset(0, 0.0004) },
    { id: 'cp-04', order: 4, name: 'Car Park', code: 'SS-CP-04', ...offset(-0.0004, 0) },
  ];
  return defs.map((d) => ({ ...d, shiftId, radiusMeters: 150 }));
}

function offset(dLat: number, dLng: number): { latitude: number; longitude: number } {
  return { latitude: MOCK_BASE.latitude + dLat, longitude: MOCK_BASE.longitude + dLng };
}

function normalizeList(data: unknown): Checkpoint[] {
  if (Array.isArray(data)) return data as Checkpoint[];
  if (data && typeof data === 'object') {
    const items = (data as { items?: Checkpoint[] }).items;
    if (Array.isArray(items)) return items;
  }
  return [];
}

// ---- API --------------------------------------------------------------------
export async function getCheckpoints(shiftId: string): Promise<Checkpoint[]> {
  if (USE_MOCK) return getMockCheckpoints(shiftId);

  try {
    const { data } = await http.get(`/shifts/${shiftId}/checkpoints`);
    return normalizeList(data);
  } catch (error) {
    // Backend not implemented yet -> fall back to the mock so the app still works.
    if (axios.isAxiosError(error) && [404, 501].includes(error.response?.status ?? 0)) {
      return getMockCheckpoints(shiftId);
    }
    throw error;
  }
}

export type SubmitScanInput = {
  shiftId: string;
  checkpointId: string;
  code: string;
  latitude: number;
  longitude: number;
  timestamp: number;
};

export async function submitCheckpointScan(input: SubmitScanInput): Promise<CheckpointScan> {
  const scan: CheckpointScan = {
    checkpointId: input.checkpointId,
    scannedAt: new Date(input.timestamp).toISOString(),
    latitude: input.latitude,
    longitude: input.longitude,
  };

  if (USE_MOCK) return scan;

  const { data } = await http.post<{ scan: CheckpointScan }>(
    `/shifts/${input.shiftId}/patrol/scan`,
    {
      checkpointId: input.checkpointId,
      code: input.code,
      latitude: input.latitude,
      longitude: input.longitude,
      timestamp: input.timestamp,
    },
  );
  return data?.scan ?? scan;
}

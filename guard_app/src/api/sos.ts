// src/api/sos.ts
import axios from 'axios';

import http from '../lib/http';

/**
 * When the backend has the /sos/* routes implemented, set USE_MOCK_SOS to
 * false (or remove the mock branches) so the real API is called instead.
 */
const USE_MOCK_SOS = true;

export type LocationPayload = {
  latitude: number;
  longitude: number;
  timestamp?: number;
};

export type SOSStatus =
  | 'pending'
  | 'notifying'
  | 'notified'
  | 'connected'
  | 'cancelled'
  | 'resolved';

export type SOSEvent = {
  status: SOSStatus;
  message?: string;
  at: string; // ISO timestamp
};

export type SOSAlert = {
  _id: string;
  guardId: string;
  shiftId?: string | null;
  triggeredAt: string;
  status: SOSStatus;
  statusMessage?: string;
  location: LocationPayload;
  history?: SOSEvent[];
  note?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
  } | null;
  cancelledAt?: string | null;
  resolvedAt?: string | null;
};

type SOSResponse = {
  message?: string;
  sos: SOSAlert;
};

/* ------------------------------------------------------------------ */
/* Mock implementation                                                 */
/* ------------------------------------------------------------------ */

let mockStore: SOSAlert | null = null;

function nowIso() {
  return new Date().toISOString();
}

function randomId() {
  return 'mock-' + Math.random().toString(36).slice(2, 10);
}

function buildInitialAlert(loc: LocationPayload, note?: string): SOSAlert {
  return {
    _id: randomId(),
    guardId: 'mock-guard',
    shiftId: null,
    triggeredAt: nowIso(),
    status: 'pending',
    statusMessage: 'Connecting to dispatch...',
    location: loc,
    note,
    history: [{ status: 'pending', message: 'SOS triggered', at: nowIso() }],
    // For emulator testing, use a non-emergency number so the dialer opens.
    // In production this should be '000' (or whatever the emergency contact is).
    emergencyContact: { name: 'Emergency Services', phone: '0412345678' },
  };
}

/**
 * Simulate the alert progressing through statuses based on how long it has
 * been active. Each call to getSOSStatus moves it forward if appropriate.
 */
function advanceMockStatus(alertObj: SOSAlert): SOSAlert {
  if (alertObj.status === 'cancelled' || alertObj.status === 'resolved') {
    return alertObj;
  }
  const elapsed = Date.now() - new Date(alertObj.triggeredAt).getTime();
  const next = { ...alertObj, history: [...(alertObj.history ?? [])] };
  if (elapsed > 25_000 && alertObj.status !== 'connected') {
    next.status = 'connected';
    next.statusMessage = 'Connected to dispatch — help is on the way';
    next.history.push({ status: 'connected', at: nowIso() });
  } else if (elapsed > 15_000 && alertObj.status === 'notifying') {
    next.status = 'notified';
    next.statusMessage = 'Supervisor notified';
    next.history.push({ status: 'notified', at: nowIso() });
  } else if (elapsed > 5_000 && alertObj.status === 'pending') {
    next.status = 'notifying';
    next.statusMessage = 'Notifying supervisor...';
    next.history.push({ status: 'notifying', at: nowIso() });
  }
  return next;
}

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

// 🚨 Trigger SOS
export async function triggerSOS(loc: LocationPayload, note?: string): Promise<SOSAlert> {
  if (USE_MOCK_SOS) {
    mockStore = buildInitialAlert(loc, note);
    return delay(mockStore, 400);
  }
  try {
    const { data } = await http.post<SOSResponse>('/sos/trigger', {
      latitude: loc.latitude,
      longitude: loc.longitude,
      timestamp: loc.timestamp,
      note,
    });
    return data.sos;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      throw new Error(message || `Failed to trigger SOS (${error.response?.status ?? 'unknown'})`);
    }
    throw new Error('Failed to trigger SOS');
  }
}

// 📍 Push a location update for an active SOS
export async function updateSOSLocation(sosId: string, loc: LocationPayload): Promise<SOSAlert> {
  if (USE_MOCK_SOS) {
    if (!mockStore || mockStore._id !== sosId) {
      throw new Error('No active mock SOS for that id');
    }
    mockStore = { ...mockStore, location: loc };
    return delay(mockStore, 100);
  }
  try {
    const { data } = await http.post<SOSResponse>(`/sos/${sosId}/location`, {
      latitude: loc.latitude,
      longitude: loc.longitude,
      timestamp: loc.timestamp,
    });
    return data.sos;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      throw new Error(
        message || `Failed to update SOS location (${error.response?.status ?? 'unknown'})`,
      );
    }
    throw new Error('Failed to update SOS location');
  }
}

// 📝 Add or update a note on an active SOS
export async function addSOSNote(sosId: string, note: string): Promise<SOSAlert> {
  if (USE_MOCK_SOS) {
    if (!mockStore || mockStore._id !== sosId) {
      throw new Error('No active mock SOS for that id');
    }
    mockStore = { ...mockStore, note };
    return delay(mockStore, 200);
  }
  try {
    const { data } = await http.post<SOSResponse>(`/sos/${sosId}/note`, { note });
    return data.sos;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      throw new Error(message || `Failed to add SOS note (${error.response?.status ?? 'unknown'})`);
    }
    throw new Error('Failed to add SOS note');
  }
}

// ❌ Cancel an active SOS (within grace period or with confirmation)
export async function cancelSOS(sosId: string): Promise<SOSAlert> {
  if (USE_MOCK_SOS) {
    if (!mockStore || mockStore._id !== sosId) {
      throw new Error('No active mock SOS for that id');
    }
    mockStore = {
      ...mockStore,
      status: 'cancelled',
      statusMessage: 'SOS cancelled by guard',
      cancelledAt: nowIso(),
      history: [
        ...(mockStore.history ?? []),
        { status: 'cancelled', at: nowIso(), message: 'SOS cancelled by guard' },
      ],
    };
    return delay(mockStore, 200);
  }
  try {
    const { data } = await http.post<SOSResponse>(`/sos/${sosId}/cancel`, {});
    return data.sos;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      throw new Error(message || `Failed to cancel SOS (${error.response?.status ?? 'unknown'})`);
    }
    throw new Error('Failed to cancel SOS');
  }
}

// 🔄 Get the latest status for an active SOS (used for polling)
export async function getSOSStatus(sosId: string): Promise<SOSAlert> {
  if (USE_MOCK_SOS) {
    if (!mockStore || mockStore._id !== sosId) {
      throw new Error('No active mock SOS for that id');
    }
    mockStore = advanceMockStatus(mockStore);
    return delay(mockStore, 150);
  }
  try {
    const { data } = await http.get<SOSResponse>(`/sos/${sosId}`);
    return data.sos;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      throw new Error(
        message || `Failed to fetch SOS status (${error.response?.status ?? 'unknown'})`,
      );
    }
    throw new Error('Failed to fetch SOS status');
  }
}

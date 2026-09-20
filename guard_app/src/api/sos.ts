// src/api/sos.ts
import axios from 'axios';

import http from '../lib/http';

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
/* Public API                                                          */
/*                                                                     */
/* Backed by the real /sos/* routes (guard role):                      */
/*   POST /sos/trigger, POST /sos/:id/location, POST /sos/:id/note,    */
/*   POST /sos/:id/cancel, GET /sos/:id, GET /sos/active.              */
/* ------------------------------------------------------------------ */

// 🚨 Trigger SOS
export async function triggerSOS(loc: LocationPayload, note?: string): Promise<SOSAlert> {
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

// 🟢 Get the guard's currently active SOS (if any) — used to restore UI state
export async function getActiveSOS(): Promise<SOSAlert | null> {
  try {
    const { data } = await http.get<SOSResponse>('/sos/active');
    return data.sos ?? null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // No active SOS is a normal, non-error state.
      if (error.response?.status === 404) return null;
      const message = error.response?.data?.message;
      throw new Error(
        message || `Failed to fetch active SOS (${error.response?.status ?? 'unknown'})`,
      );
    }
    throw new Error('Failed to fetch active SOS');
  }
}

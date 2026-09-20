// Constants + pure formatters for the Active SOS screen.
// Extracted from ActiveSOSScreen.tsx (GA-021) unchanged.

import type { SOSStatus } from '../api/sos';

export const CANCEL_GRACE_MS = 10_000;
export const STATUS_POLL_MS = 5_000;
export const LOCATION_PUSH_INTERVAL_MS = 15_000;
export const LOCATION_DISTANCE_INTERVAL_M = 10;

export type Coords = {
  latitude: number;
  longitude: number;
  timestamp?: number;
};

export const STATUS_LABELS: Record<SOSStatus, string> = {
  pending: 'Sending SOS...',
  notifying: 'Notifying supervisor',
  notified: 'Supervisor notified',
  connected: 'Connected — help on the way',
  cancelled: 'SOS cancelled',
  resolved: 'SOS resolved',
};

export function formatTime(iso?: string) {
  if (!iso) return '--:--:--';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString();
  } catch {
    return '--:--:--';
  }
}

export function formatCoord(value?: number) {
  if (typeof value !== 'number') return '—';
  return value.toFixed(5);
}

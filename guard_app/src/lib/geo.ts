// Pure geospatial helpers (no side effects) used by the patrol / guard-tour
// feature to verify a guard is physically at a checkpoint. Kept dependency-free
// so it is trivial to unit test.

export type LatLng = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Great-circle distance between two coordinates, in metres (haversine).
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Whether `current` is within `radiusMeters` of `target`. Returns the distance
// too so callers can show "you are 42 m away".
export function checkWithinRadius(
  current: LatLng,
  target: LatLng,
  radiusMeters: number,
): { within: boolean; distanceMeters: number } {
  const distanceMeters = haversineMeters(current, target);
  return { within: distanceMeters <= radiusMeters, distanceMeters };
}

// Friendly distance label, e.g. "45 m" or "1.2 km".
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Thin wrapper around expo-location for one-shot GPS reads used by the patrol
// feature. Handles permission requests and falls back to the last known
// position if a fresh fix times out.
import * as Location from 'expo-location';

import type { LocationPayload } from '../api/attendance';

export class LocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocationError';
  }
}

const FIX_TIMEOUT_MS = 8000;

// Returns the device's current coordinates. Throws LocationError if permission
// is denied or no fix can be obtained.
export async function getCurrentLocation(): Promise<LocationPayload> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new LocationError('Location permission denied');
  }

  let fix: Location.LocationObject | null = null;
  try {
    fix = await Promise.race<Location.LocationObject>([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<Location.LocationObject>((_, reject) =>
        setTimeout(() => reject(new LocationError('Timed out getting location')), FIX_TIMEOUT_MS),
      ),
    ]);
  } catch {
    fix = await Location.getLastKnownPositionAsync();
  }

  if (!fix) {
    throw new LocationError('Unable to determine your location');
  }

  return {
    latitude: fix.coords.latitude,
    longitude: fix.coords.longitude,
    timestamp: typeof fix.timestamp === 'number' ? fix.timestamp : Date.now(),
  };
}

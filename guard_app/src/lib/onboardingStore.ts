import AsyncStorage from '@react-native-async-storage/async-storage';

// GA-023 — first-run guided tour.
// The "seen" flag is a non-secret, device-local preference, so it lives in
// AsyncStorage (same pattern as the other small stores in this folder).
const TOUR_SEEN_KEY = '@guard_onboarding_tour_seen_v1';

/** True once the guard has completed or skipped the first-run tour. */
export async function hasSeenTour(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(TOUR_SEEN_KEY);
    return raw === 'true';
  } catch {
    // If storage is unreadable, err on the side of NOT nagging the user again.
    return true;
  }
}

/** Persist that the tour has been seen so it does not reappear. */
export async function setTourSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(TOUR_SEEN_KEY, 'true');
  } catch {
    // Non-fatal: worst case the tour shows again next launch.
  }
}

/** Clear the "seen" flag (used when replaying from Settings). */
export async function resetTourSeen(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOUR_SEEN_KEY);
  } catch {
    // Non-fatal.
  }
}

// --- Replay signalling -------------------------------------------------------
// Settings lives on a different screen from where the tour is mounted (AppTabs),
// and AppTabs is already mounted when the user taps "Replay". A tiny in-memory
// pub/sub lets Settings ask the mounted tour to show again without prop drilling
// or navigation params.
type ReplayListener = () => void;

const replayListeners = new Set<ReplayListener>();

/** Ask any mounted tour to replay. */
export function requestTourReplay(): void {
  replayListeners.forEach((listener) => listener());
}

/** Subscribe to replay requests. Returns an unsubscribe function. */
export function subscribeTourReplay(listener: ReplayListener): () => void {
  replayListeners.add(listener);
  return () => {
    replayListeners.delete(listener);
  };
}

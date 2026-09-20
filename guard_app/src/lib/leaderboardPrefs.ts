import AsyncStorage from '@react-native-async-storage/async-storage';

// GA-033 — leaderboard is opt-in for privacy. The guard's choice is a non-secret
// device-local preference, so it lives in AsyncStorage.
const OPT_IN_KEY = '@guard_leaderboard_optin_v1';

/** Whether the guard has opted into the (anonymised) leaderboard. Default: off. */
export async function getLeaderboardOptIn(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(OPT_IN_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setLeaderboardOptIn(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(OPT_IN_KEY, value ? 'true' : 'false');
  } catch {
    // Non-fatal: falls back to opted-out.
  }
}

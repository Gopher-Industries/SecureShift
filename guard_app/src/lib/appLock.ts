import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

// Whether the user has turned on the app lock. This is a preference, not a
// secret, so it lives in AsyncStorage.
const LOCK_ENABLED_KEY = 'app_lock_enabled';

export async function isLockEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(LOCK_ENABLED_KEY)) === 'true';
}

export async function setLockEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(LOCK_ENABLED_KEY, enabled ? 'true' : 'false');
}

// True only when the device has biometric hardware AND the user has enrolled
// a biometric (or, for our purposes, can fall back to a device passcode).
export async function isBiometricSupported(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

// Prompts for Face ID / fingerprint, with the device PIN/passcode as a fallback.
export async function authenticate(promptMessage: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    // Allow the OS passcode fallback so a user can always get in with their PIN.
    disableDeviceFallback: false,
  });
  return result.success;
}

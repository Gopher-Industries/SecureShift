/* eslint-env jest */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

import {
  authenticate,
  isBiometricSupported,
  isLockEnabled,
  setLockEnabled,
} from '../../src/lib/appLock';

describe('appLock', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });
  });

  it('defaults to disabled when nothing is stored', async () => {
    expect(await isLockEnabled()).toBe(false);
  });

  it('persists and reads the enabled flag', async () => {
    await setLockEnabled(true);
    expect(await isLockEnabled()).toBe(true);

    await setLockEnabled(false);
    expect(await isLockEnabled()).toBe(false);
  });

  it('reports biometric support only when hardware exists and is enrolled', async () => {
    expect(await isBiometricSupported()).toBe(true);

    LocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(false);
    expect(await isBiometricSupported()).toBe(false);

    LocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(false);
    expect(await isBiometricSupported()).toBe(false);
  });

  it('authenticate() returns true on success and false on failure', async () => {
    expect(await authenticate('Unlock')).toBe(true);

    LocalAuthentication.authenticateAsync.mockResolvedValueOnce({ success: false });
    expect(await authenticate('Unlock')).toBe(false);
  });

  it('authenticate() allows the device passcode fallback', async () => {
    await authenticate('Unlock');
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ disableDeviceFallback: false }),
    );
  });
});

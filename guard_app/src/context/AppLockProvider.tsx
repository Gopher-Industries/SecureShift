import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, AppStateStatus } from 'react-native';

import LockOverlay from '../components/LockOverlay';
import {
  authenticate,
  isBiometricSupported,
  isLockEnabled,
  setLockEnabled as persistLockEnabled,
} from '../lib/appLock';

type AppLockContextValue = {
  // Whether the user has turned the lock on.
  enabled: boolean;
  // Whether the device can actually do biometric/passcode auth.
  supported: boolean;
  setEnabled: (value: boolean) => Promise<void>;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function useAppLock(): AppLockContextValue {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}

export default function AppLockProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [enabled, setEnabledState] = useState(false);
  const [supported, setSupported] = useState(false);
  const [locked, setLocked] = useState(false);
  const authInFlight = useRef(false);

  // Keep the latest translator in a ref so runAuth can stay referentially
  // stable (a t() dependency would re-run the mount effect on every render).
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const runAuth = useCallback(async () => {
    // Guard against double prompts (e.g. rapid AppState changes).
    if (authInFlight.current) return;
    authInFlight.current = true;
    try {
      const ok = await authenticate(tRef.current('appLock.prompt'));
      if (ok) setLocked(false);
    } finally {
      authInFlight.current = false;
    }
  }, []);

  // Load the saved preference + device capability once on mount, and lock if
  // needed. Wrapped in try/catch so an unavailable native module (e.g. web)
  // can never crash or loop the app.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [sup, en] = await Promise.all([isBiometricSupported(), isLockEnabled()]);
        if (!active) return;
        setSupported(sup);
        setEnabledState(en);
        if (en && sup) {
          setLocked(true);
          void runAuth();
        }
      } catch {
        // Biometrics unavailable — leave the app unlocked (no lockout).
      }
    })();
    return () => {
      active = false;
    };
  }, [runAuth]);

  // Re-lock when the app returns from a real background.
  // NOTE: only 'background' -> 'active' counts. The biometric/passcode sheet
  // briefly flips the app to 'inactive'; treating that as a foreground return
  // would re-lock during authentication and loop the prompt forever.
  useEffect(() => {
    let previous: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
      const cameFromBackground = previous === 'background' && next === 'active';
      if (cameFromBackground && enabled && supported && !authInFlight.current) {
        setLocked(true);
        void runAuth();
      }
      previous = next;
    });
    return () => subscription.remove();
  }, [enabled, supported, runAuth]);

  const setEnabled = useCallback(async (value: boolean) => {
    await persistLockEnabled(value);
    setEnabledState(value);
  }, []);

  return (
    <AppLockContext.Provider value={{ enabled, supported, setEnabled }}>
      {children}
      {locked ? <LockOverlay onUnlock={runAuth} /> : null}
    </AppLockContext.Provider>
  );
}

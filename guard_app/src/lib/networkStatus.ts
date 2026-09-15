// Shared network-status helpers built on expo-network.
//
// The connectivity *listener* does not fire reliably in Expo Go, so we read the
// state on demand (getIsConnected) and poll it for the hook (useNetworkStatus).
// This matches how OfflineBanner already detects connectivity.
import * as Network from 'expo-network';
import { useEffect, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 3000;

// One-shot read of connectivity. Defaults to `true` (assume online) if the
// state cannot be read, so we never block a real action on a failed check.
export async function getIsConnected(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected !== false;
  } catch {
    return true;
  }
}

type NetworkStatus = {
  isConnected: boolean;
  // Fires once each time we transition from offline -> online.
  justReconnected: boolean;
};

// Polls connectivity and reports the current state plus a one-tick
// `justReconnected` flag on each offline -> online transition.
export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);
  const prevConnected = useRef(true);

  useEffect(() => {
    let active = true;

    const check = async () => {
      const connected = await getIsConnected();
      if (!active) return;

      const wasOffline = prevConnected.current === false;
      prevConnected.current = connected;

      setIsConnected(connected);
      setJustReconnected(wasOffline && connected);
    };

    void check();
    const timer = setInterval(() => void check(), POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return { isConnected, justReconnected };
}

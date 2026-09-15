// App-level hook that flushes the offline attendance queue when connectivity
// returns, when the app is foregrounded, and once on mount. Exposes the number
// of still-pending actions so the UI can show a "waiting to sync" indicator.
import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { getQueueCount } from '../lib/attendanceQueue';
import { syncPendingAttendance } from '../lib/attendanceSync';
import { useNetworkStatus } from '../lib/networkStatus';

export function useAttendanceSync() {
  const { isConnected, justReconnected } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    setPendingCount(await getQueueCount());
  }, []);

  const flush = useCallback(async () => {
    await syncPendingAttendance();
    await refreshCount();
  }, [refreshCount]);

  // Once on mount (covers a queue left over from a previous session).
  useEffect(() => {
    void flush();
  }, [flush]);

  // Whenever we transition offline -> online.
  useEffect(() => {
    if (justReconnected) void flush();
  }, [justReconnected, flush]);

  // Whenever the app comes back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void flush();
    });
    return () => sub.remove();
  }, [flush]);

  // Keep the count fresh while offline (actions get queued from other screens).
  useEffect(() => {
    void refreshCount();
    const timer = setInterval(() => void refreshCount(), 4000);
    return () => clearInterval(timer);
  }, [refreshCount]);

  return { pendingCount, isConnected, syncNow: flush };
}

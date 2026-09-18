import { useEffect, useRef } from 'react';

const DEFAULT_INTERVAL = 30000;

export default function useAutoRefresh(
  refreshFunction,
  interval = DEFAULT_INTERVAL,
  enabled = true
) {
  const refreshRef = useRef(refreshFunction);

  useEffect(() => {
    refreshRef.current = refreshFunction;
  }, [refreshFunction]);

  useEffect(() => {
    let intervalId = null;

    const stopPolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const startPolling = () => {
      stopPolling();

      if (!enabled || document.visibilityState === 'hidden') {
        return;
      }

      intervalId = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          void refreshRef.current();
        }
      }, interval);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopPolling();
      } else if (enabled) {
        void refreshRef.current();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval, enabled]);
}

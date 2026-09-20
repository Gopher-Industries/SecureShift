import { useCallback, useEffect, useState } from 'react';

import {
  hasSeenTour,
  resetTourSeen,
  setTourSeen,
  subscribeTourReplay,
} from '../lib/onboardingStore';

type UseOnboardingTour = {
  /** Whether the tour overlay should be shown. */
  visible: boolean;
  /** Finish or skip the tour: persist "seen" and hide it. */
  finish: () => void;
  /** Show the tour again (from Settings) and clear the "seen" flag. */
  replay: () => void;
};

/**
 * Drives first-run visibility of the guided tour and listens for replay
 * requests from elsewhere in the app (e.g. Settings). Non-blocking: it only
 * flips a boolean; the caller renders the overlay.
 */
export function useOnboardingTour(): UseOnboardingTour {
  const [visible, setVisible] = useState(false);

  // First launch: show the tour only if it hasn't been seen yet.
  useEffect(() => {
    let active = true;
    void hasSeenTour().then((seen) => {
      if (active && !seen) setVisible(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Replay requests from other screens.
  useEffect(() => {
    return subscribeTourReplay(() => setVisible(true));
  }, []);

  const finish = useCallback(() => {
    setVisible(false);
    void setTourSeen();
  }, []);

  const replay = useCallback(() => {
    void resetTourSeen();
    setVisible(true);
  }, []);

  return { visible, finish, replay };
}

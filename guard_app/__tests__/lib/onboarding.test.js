/* eslint-env jest */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getNextIndex,
  getPrevIndex,
  isFirstStep,
  isLastStep,
  TOUR_STEPS,
  TOUR_STEP_COUNT,
} from '../../src/lib/onboarding';
import {
  hasSeenTour,
  setTourSeen,
  resetTourSeen,
  requestTourReplay,
  subscribeTourReplay,
} from '../../src/lib/onboardingStore';

describe('onboarding step model', () => {
  it('has a short tour with unique step ids', () => {
    expect(TOUR_STEP_COUNT).toBe(TOUR_STEPS.length);
    expect(TOUR_STEP_COUNT).toBeGreaterThan(0);
    expect(TOUR_STEP_COUNT).toBeLessThanOrEqual(6); // "keep it short"
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes coach-mark spotlights for the SOS button and tab bar', () => {
    const anchors = TOUR_STEPS.filter((s) => s.kind === 'spotlight').map((s) => s.anchor);
    expect(anchors).toContain('sos');
    expect(anchors).toContain('tabbar');
  });

  it('navigates forward and back with clamping at the ends', () => {
    expect(isFirstStep(0)).toBe(true);
    expect(getPrevIndex(0)).toBe(0); // clamped
    expect(getNextIndex(0)).toBe(1);

    const lastIndex = TOUR_STEP_COUNT - 1;
    expect(isLastStep(lastIndex)).toBe(true);
    expect(getNextIndex(lastIndex)).toBe(lastIndex); // clamped
    expect(getPrevIndex(lastIndex)).toBe(lastIndex - 1);
  });
});

describe('onboarding "seen" persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to not seen on first launch', async () => {
    expect(await hasSeenTour()).toBe(false);
  });

  it('persists the seen flag so the tour does not reappear', async () => {
    await setTourSeen();
    expect(await hasSeenTour()).toBe(true);
  });

  it('resets the seen flag for replay', async () => {
    await setTourSeen();
    await resetTourSeen();
    expect(await hasSeenTour()).toBe(false);
  });
});

describe('replay signalling', () => {
  it('notifies subscribers and stops after unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeTourReplay(listener);

    requestTourReplay();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    requestTourReplay();
    expect(listener).toHaveBeenCalledTimes(1); // not called again
  });
});

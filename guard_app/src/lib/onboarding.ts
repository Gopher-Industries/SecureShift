// GA-023 — first-run guided tour step model (pure, no React) so the flow can be
// unit-tested without rendering.

import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type TourStep = {
  /** Stable id for testing / analytics. */
  id: string;
  /**
   * 'card'      — a centered welcome-carousel slide.
   * 'spotlight' — dims the screen and highlights a real control (coach-mark).
   */
  kind: 'card' | 'spotlight';
  /** Which on-screen control a spotlight step points at. */
  anchor?: 'sos' | 'tabbar';
  icon: IoniconName;
  titleKey: string;
  bodyKey: string;
};

// Kept intentionally short and skippable (see ticket: "keep it short").
export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'welcome',
    kind: 'card',
    icon: 'sparkles-outline',
    titleKey: 'onboarding.welcomeTitle',
    bodyKey: 'onboarding.welcomeBody',
  },
  {
    id: 'shifts',
    kind: 'card',
    icon: 'briefcase-outline',
    titleKey: 'onboarding.shiftsTitle',
    bodyKey: 'onboarding.shiftsBody',
  },
  {
    id: 'attendance',
    kind: 'card',
    icon: 'checkmark-done-outline',
    titleKey: 'onboarding.attendanceTitle',
    bodyKey: 'onboarding.attendanceBody',
  },
  {
    id: 'sos',
    kind: 'spotlight',
    anchor: 'sos',
    icon: 'alert-circle',
    titleKey: 'onboarding.sosTitle',
    bodyKey: 'onboarding.sosBody',
  },
  {
    id: 'explore',
    kind: 'spotlight',
    anchor: 'tabbar',
    icon: 'apps-outline',
    titleKey: 'onboarding.exploreTitle',
    bodyKey: 'onboarding.exploreBody',
  },
] as const;

export const TOUR_STEP_COUNT = TOUR_STEPS.length;

export function isFirstStep(index: number): boolean {
  return index <= 0;
}

export function isLastStep(index: number): boolean {
  return index >= TOUR_STEP_COUNT - 1;
}

/** Next index, clamped to the last step. */
export function getNextIndex(index: number): number {
  return Math.min(index + 1, TOUR_STEP_COUNT - 1);
}

/** Previous index, clamped to the first step. */
export function getPrevIndex(index: number): number {
  return Math.max(index - 1, 0);
}

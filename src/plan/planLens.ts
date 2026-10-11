import { PLAN_PATH } from '../config/surfacePaths';
import { planWishlistTabPath } from './planTab';

/** Plan tab sections — URL `?lens=` (with `view=plans`). */
export type PlanLens = 'schedule' | 'calendar' | 'saved' | 'goals' | 'availability';

export const PLAN_LENS_SEGMENTS: { key: PlanLens; label: string }[] = [
  { key: 'schedule', label: 'Schedule' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'availability', label: 'Available' },
  { key: 'saved', label: 'Saved' },
  { key: 'goals', label: 'Goals' },
];

export const parsePlanLens = (raw: string | null): PlanLens => {
  if (
    raw === 'calendar' ||
    raw === 'saved' ||
    raw === 'goals' ||
    raw === 'availability'
  ) {
    return raw;
  }
  return 'schedule';
};

export const planLensPath = (lens: PlanLens = 'schedule'): string => {
  const params = new URLSearchParams();
  params.set('view', 'plans');
  if (lens !== 'schedule') {
    params.set('lens', lens);
  }
  return `${PLAN_PATH}?${params.toString()}`;
};

/** Canonical saved / wishlist entry on Plan (`D13` in member-surfaces-implementation-plan). */
export const planSavedPath = (): string => planWishlistTabPath();

import { PLAN_PATH } from '../config/surfacePaths';
import { planWishlistTabPath } from './planTab';

/**
 * Legacy `?lens=` values on `/plan` — normalize via `normalizePlanMobileParams`.
 * New links: `tab=upcoming|wishlist`, `layout=calendar`. Legacy `lens=availability` → explore compose.
 */
export type PlanLens = 'schedule' | 'calendar' | 'saved' | 'goals';

export const parsePlanLens = (raw: string | null): PlanLens => {
  if (raw === 'calendar' || raw === 'saved' || raw === 'goals') {
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

/** Goals block on Plan — same tab as wishlist (`?view=plans&tab=wishlist`). */
export const planGoalsWishlistPath = (): string => planWishlistTabPath();

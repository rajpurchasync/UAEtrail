import { planMainTabPath } from './planTab';

/**
 * Canonical Plan URLs — `tab=upcoming|wishlist`, `layout=calendar`.
 * `lens=` is not emitted (stripped on load via `normalizePlanMobileParams`).
 */
export type PlanLens = 'schedule' | 'calendar' | 'saved' | 'goals';

export const planLensPath = (lens: PlanLens = 'schedule'): string => {
  if (lens === 'saved' || lens === 'goals') {
    return planMainTabPath('wishlist');
  }
  if (lens === 'calendar') {
    return planMainTabPath('upcoming', { layout: 'calendar' });
  }
  return planMainTabPath('upcoming');
};

/** Canonical saved / wishlist entry on Plan (`D13` in member-surfaces-implementation-plan). */
export const planSavedPath = (): string => planMainTabPath('wishlist');

/** Goals block on Plan — same tab as wishlist (`?view=plans&tab=wishlist`). */
export const planGoalsWishlistPath = (): string => planMainTabPath('wishlist');
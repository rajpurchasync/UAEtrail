import { describe, expect, it } from 'vitest';
import {
  normalizePlanSearchParams,
  planAvailabilityPath,
  planHostedSchedulePath,
  planJoinedSchedulePath,
  planUpcomingPath,
  planWishlistTabPath,
  tripsPlansPath,
} from './planRouting';

describe('planRouting', () => {
  it('builds canonical upcoming and wishlist paths', () => {
    expect(planUpcomingPath('hosting')).toBe('/plan?view=plans&filter=hosting');
    expect(planUpcomingPath('joined')).toBe('/plan?view=plans&filter=joined');
    expect(planWishlistTabPath()).toBe('/plan?view=plans&tab=wishlist');
    expect(planAvailabilityPath()).toBe('/plan?view=plans&lens=availability');
    expect(planHostedSchedulePath()).toBe(planUpcomingPath('hosting'));
    expect(planJoinedSchedulePath()).toBe(planUpcomingPath('joined'));
    expect(tripsPlansPath('hosted')).toBe(planHostedSchedulePath());
    expect(tripsPlansPath('wishlist')).toBe(planWishlistTabPath());
  });

  it('normalizes legacy role= into filter=', () => {
    const params = new URLSearchParams('view=plans&role=hosted');
    const { changed } = normalizePlanSearchParams(params, true);
    expect(changed).toBe(true);
    expect(params.get('filter')).toBe('hosting');
    expect(params.get('role')).toBeNull();
  });

  it('normalizes lens=goals into tab=wishlist', () => {
    const params = new URLSearchParams('view=plans&lens=goals');
    const { changed } = normalizePlanSearchParams(params, false);
    expect(changed).toBe(true);
    expect(params.get('tab')).toBe('wishlist');
    expect(params.get('lens')).toBeNull();
  });

  it('keeps availability lens for deep links', () => {
    const params = new URLSearchParams('view=plans&lens=availability');
    const { changed } = normalizePlanSearchParams(params, true);
    expect(params.get('lens')).toBe('availability');
    expect(changed).toBe(false);
  });
});

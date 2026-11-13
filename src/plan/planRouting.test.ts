import { describe, expect, it } from 'vitest';
import {
  normalizePlanSearchParams,
  planAvailabilityPath,
  planHostedSchedulePath,
  planJoinedSchedulePath,
  planMemberNavPath,
  isPlanHostingFilterRoute,
  isPlanMemberNavActive,
  planUpcomingPath,
  planWishlistTabPath,
  planPlansRolePath,
} from './planRouting';

describe('planRouting', () => {
  it('splits member vs organiser nav targets', () => {
    expect(planMemberNavPath(false)).toBe('/plan');
    expect(planMemberNavPath(true)).toBe('/plan?view=plans&filter=joined');
    expect(isPlanHostingFilterRoute('/hosting', '')).toBe(true);
    expect(isPlanHostingFilterRoute('/plan', '?view=plans&filter=hosting')).toBe(true);
    expect(isPlanMemberNavActive('/plan', '?view=plans&filter=hosting', true)).toBe(false);
    expect(isPlanMemberNavActive('/plan', '?view=plans&filter=joined', true)).toBe(true);
    expect(isPlanMemberNavActive('/plan/today', '', true)).toBe(false);
    expect(isPlanMemberNavActive('/plan/today', '', false)).toBe(false);
  });

  it('builds canonical upcoming and wishlist paths', () => {
    expect(planUpcomingPath('hosting')).toBe('/hosting');
    expect(planUpcomingPath('joined')).toBe('/plan?view=plans&filter=joined');
    expect(planWishlistTabPath()).toBe('/plan?view=plans&tab=wishlist');
    expect(planAvailabilityPath()).toBe('/plan?view=plans&lens=availability');
    expect(planHostedSchedulePath()).toBe('/hosting');
    expect(planJoinedSchedulePath()).toBe(planUpcomingPath('joined'));
    expect(planPlansRolePath('hosted')).toBe(planHostedSchedulePath());
    expect(planPlansRolePath('wishlist')).toBe(planWishlistTabPath());
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

  it('preserves tab=wishlist when normalizing plan hub params', () => {
    const params = new URLSearchParams('view=plans&tab=wishlist');
    normalizePlanSearchParams(params, true);
    expect(params.get('tab')).toBe('wishlist');
  });

  it('still strips legacy inbound tab=joined', () => {
    const params = new URLSearchParams('view=plans&tab=joined');
    const { changed } = normalizePlanSearchParams(params, true);
    expect(changed).toBe(true);
    expect(params.get('tab')).toBeNull();
  });
});

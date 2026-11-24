import { describe, expect, it } from 'vitest';
import { OPERATOR_OVERVIEW_PATH } from '../config/surfacePaths';
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
    expect(planUpcomingPath('hosting')).toBe('/plan?view=plans&filter=hosting');
    expect(planUpcomingPath('joined')).toBe('/plan?view=plans&filter=joined');
    expect(planWishlistTabPath()).toBe('/plan?view=plans&tab=wishlist');
    expect(planAvailabilityPath()).toBe('/explore?list=1&compose=intent%3Aopen&view=people');
    expect(planHostedSchedulePath()).toBe(OPERATOR_OVERVIEW_PATH);
    expect(planJoinedSchedulePath()).toBe(planUpcomingPath('joined'));
    expect(planPlansRolePath('hosted')).toBe(planHostedSchedulePath());
    expect(planPlansRolePath('wishlist')).toBe(planWishlistTabPath());
  });

  it('strips stale role= without remapping', () => {
    const params = new URLSearchParams('view=plans&role=hosted');
    const { changed } = normalizePlanSearchParams(params, true);
    expect(changed).toBe(true);
    expect(params.get('role')).toBeNull();
    expect(params.get('filter')).toBe('joined');
  });

  it('strips stale lens= without remapping', () => {
    const params = new URLSearchParams('view=plans&lens=goals');
    const { changed } = normalizePlanSearchParams(params, false);
    expect(changed).toBe(true);
    expect(params.get('lens')).toBeNull();
    expect(params.get('tab')).toBeNull();
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

  it('maps inbound segment=wishlist to canonical tab=wishlist', () => {
    const params = new URLSearchParams('view=plans&segment=wishlist');
    const { changed } = normalizePlanSearchParams(params, true);
    expect(changed).toBe(true);
    expect(params.get('segment')).toBeNull();
    expect(params.get('tab')).toBe('wishlist');
    expect(params.get('lens')).toBeNull();
    expect(params.get('role')).toBeNull();
  });

  it('maps inbound layer=places to wishlist saved layer', () => {
    const params = new URLSearchParams('view=plans&layer=places');
    const { changed } = normalizePlanSearchParams(params, true);
    expect(changed).toBe(true);
    expect(params.get('tab')).toBe('wishlist');
    expect(params.get('saved')).toBe('places');
    expect(params.get('role')).toBeNull();
  });
});

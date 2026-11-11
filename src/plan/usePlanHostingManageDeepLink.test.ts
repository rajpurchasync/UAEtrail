import { describe, expect, it } from 'vitest';
import { planHostingDeepLinkId, planHostingRosterDeepLinkId } from './usePlanHostingManageDeepLink';

describe('planHostingDeepLinkId', () => {
  it('opens the edit sheet from peek and the crew page from roster', () => {
    const params = new URLSearchParams('peek=a&roster=b&checkin=c');
    expect(planHostingDeepLinkId(params)).toBe('a');
    expect(planHostingRosterDeepLinkId(params)).toBe('b');
    params.delete('roster');
    expect(planHostingRosterDeepLinkId(params)).toBe('c');
    params.delete('checkin');
    expect(planHostingRosterDeepLinkId(params)).toBeNull();
  });
});

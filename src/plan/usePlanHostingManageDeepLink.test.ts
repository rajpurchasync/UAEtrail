import { describe, expect, it } from 'vitest';
import { planHostingDeepLinkId } from './usePlanHostingManageDeepLink';

describe('planHostingDeepLinkId', () => {
  it('prefers peek then roster then checkin', () => {
    const params = new URLSearchParams('peek=a&roster=b&checkin=c');
    expect(planHostingDeepLinkId(params)).toBe('a');
    params.delete('peek');
    expect(planHostingDeepLinkId(params)).toBe('b');
    params.delete('roster');
    expect(planHostingDeepLinkId(params)).toBe('c');
  });
});

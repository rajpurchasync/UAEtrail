import { describe, expect, it } from 'vitest';
import { memberDiscoverProfilePath } from './memberDiscoveryExplore';

describe('memberDiscoverProfilePath', () => {
  it('tags discover opens for quota and analytics', () => {
    expect(memberDiscoverProfilePath('user-1')).toBe('/member/user-1?discover=1&source=discover');
  });
});

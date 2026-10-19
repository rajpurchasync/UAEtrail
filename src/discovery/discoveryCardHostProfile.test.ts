import { describe, expect, it } from 'vitest';
import {
  discoveryCardCanOpenHostProfile,
  resolveDiscoveryCardHostProfilePath,
  type DiscoveryCardModel,
} from './discoveryCardModel';

const activityCard = (overrides: Partial<DiscoveryCardModel> = {}): DiscoveryCardModel =>
  ({
    id: 'activity:1',
    source: 'activity',
    kind: 'hiking',
    tone: 'hiking',
    path: '/activity/1',
    activity: {
      id: '1',
      hostUserId: 'host-1',
      publishingProfileKind: 'community',
      tenantSlug: null,
    },
    featuredPerson: { userId: 'host-1', displayName: 'Host', role: 'host' },
    sections: { details: [] },
    showJoinActions: true,
    ...overrides,
  }) as DiscoveryCardModel;

describe('resolveDiscoveryCardHostProfilePath', () => {
  it('defaults community publisher to member profile', () => {
    expect(resolveDiscoveryCardHostProfilePath(activityCard())).toBe('/member/host-1');
  });

  it('routes individual Pro to member profile, not /guide', () => {
    expect(
      resolveDiscoveryCardHostProfilePath(
        activityCard({
          activity: {
            id: '1',
            hostUserId: 'host-1',
            publishingProfileKind: 'pro_guide',
            tenantSlug: 'omar-guides',
          },
        })
      )
    ).toBe('/member/host-1');
  });
});

describe('discoveryCardCanOpenHostProfile', () => {
  it('allows signed-in viewers on activity peek', () => {
    expect(discoveryCardCanOpenHostProfile(activityCard(), { isGuest: false })).toBe(true);
  });

  it('blocks guests until sign-in', () => {
    expect(discoveryCardCanOpenHostProfile(activityCard(), { isGuest: true })).toBe(false);
  });
});

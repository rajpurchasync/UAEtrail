import { describe, expect, it } from 'vitest';
import {
  discoveryCardCanOpenHostProfile,
  resolveDiscoveryCardHostProfilePath,
  resolveDiscoveryCardLocationDetailPath,
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
    expect(resolveDiscoveryCardHostProfilePath(activityCard())).toBe('/member/host-1?source=host');
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
    ).toBe('/member/host-1?source=host');
  });
});

describe('resolveDiscoveryCardLocationDetailPath', () => {
  it('uses card path for geography pins', () => {
    expect(
      resolveDiscoveryCardLocationDetailPath({
        ...activityCard(),
        source: 'place',
        path: '/place/fossil',
        locationId: 'fossil',
      } as DiscoveryCardModel)
    ).toBe('/place/fossil');
  });

  it('uses place detail when activity has locationId', () => {
    expect(
      resolveDiscoveryCardLocationDetailPath(
        activityCard({
          locationId: 'loc-1',
          activity: {
            id: '1',
            hostUserId: 'host-1',
            activityType: 'camping',
            publishingProfileKind: 'community',
          },
        })
      )
    ).toBe('/place/loc-1');
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

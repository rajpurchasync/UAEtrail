import { describe, expect, it } from 'vitest';
import {
  exploreCardCanOpenHostProfile,
  resolveExploreCardHostProfilePath,
  type ExploreCardModel,
} from './exploreCardModel';

const activityCard = (overrides: Partial<ExploreCardModel> = {}): ExploreCardModel =>
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
  }) as ExploreCardModel;

describe('resolveExploreCardHostProfilePath', () => {
  it('defaults community publisher to member profile', () => {
    expect(resolveExploreCardHostProfilePath(activityCard())).toBe('/member/host-1');
  });
});

describe('exploreCardCanOpenHostProfile', () => {
  it('allows signed-in viewers on activity peek', () => {
    expect(exploreCardCanOpenHostProfile(activityCard(), { isGuest: false })).toBe(true);
  });

  it('blocks guests until sign-in', () => {
    expect(exploreCardCanOpenHostProfile(activityCard(), { isGuest: true })).toBe(false);
  });
});

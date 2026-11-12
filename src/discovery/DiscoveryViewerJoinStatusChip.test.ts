import { describe, expect, it } from 'vitest';
import type { DiscoveryCardModel } from './discoveryCardModel';
import { resolveDiscoveryViewerJoinStatus } from './DiscoveryViewerJoinStatusChip';

const baseCard = (overrides: Partial<DiscoveryCardModel> = {}): DiscoveryCardModel =>
  ({
    id: 'activity:a1',
    source: 'activity',
    kind: 'hiking',
    path: '/activity/a1',
    activityId: 'a1',
    viewerAccess: null,
    ...overrides,
  }) as DiscoveryCardModel;

describe('resolveDiscoveryViewerJoinStatus', () => {
  it('returns joined for participant level', () => {
    expect(
      resolveDiscoveryViewerJoinStatus(
        baseCard({
          viewerAccess: {
            exposure: 'full',
            level: 'participant',
            gateReason: null,
            canViewFullActivity: true,
            canOpenDetailPage: true,
            joinMode: 'open',
            canAccessCrewSurfaces: true,
            entitlements: {
              isProMember: false,
              canViewHostProfileBeforeJoin: true,
              canViewFullBuddyRoster: false,
              canOfferTransport: true,
              canAddLinkedRide: true,
              canMessageHostBeforeJoin: true,
              buddyUserIdsOnActivity: [],
            },
          },
        })
      )
    ).toBe('joined');
  });

  it('returns pending for join_request level', () => {
    expect(
      resolveDiscoveryViewerJoinStatus(
        baseCard({
          viewerAccess: {
            exposure: 'full',
            level: 'join_request',
            gateReason: null,
            canViewFullActivity: true,
            canOpenDetailPage: true,
            joinMode: 'open',
            canAccessCrewSurfaces: false,
            entitlements: {
              isProMember: false,
              canViewHostProfileBeforeJoin: true,
              canViewFullBuddyRoster: false,
              canOfferTransport: false,
              canAddLinkedRide: false,
              canMessageHostBeforeJoin: true,
              buddyUserIdsOnActivity: [],
            },
          },
        })
      )
    ).toBe('pending');
  });

  it('ignores non-activity cards', () => {
    expect(resolveDiscoveryViewerJoinStatus(baseCard({ source: 'trail' as DiscoveryCardModel['source'] }))).toBe(
      null
    );
  });
});

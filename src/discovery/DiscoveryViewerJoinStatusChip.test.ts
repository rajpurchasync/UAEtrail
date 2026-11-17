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

  it('returns pending from pending_join wire, not bare join_request', () => {
    const entitlements = {
      isProMember: false,
      canViewHostProfileBeforeJoin: true,
      canViewFullBuddyRoster: false,
      canOfferTransport: false,
      canAddLinkedRide: false,
      canMessageHostBeforeJoin: true,
      buddyUserIdsOnActivity: [],
    };
    expect(
      resolveDiscoveryViewerJoinStatus(
        baseCard({
          viewerAccess: {
            exposure: 'redacted',
            level: 'join_request',
            gateReason: null,
            canViewFullActivity: false,
            canOpenDetailPage: true,
            joinMode: 'open',
            canAccessCrewSurfaces: false,
            entitlements,
            mapPeekActions: [{ id: 'request_join', prominence: 'primary' }],
          },
        })
      )
    ).toBeNull();
    expect(
      resolveDiscoveryViewerJoinStatus(
        baseCard({
          viewerAccess: {
            exposure: 'redacted',
            level: 'join_request',
            gateReason: null,
            canViewFullActivity: false,
            canOpenDetailPage: true,
            joinMode: 'open',
            canAccessCrewSurfaces: false,
            entitlements,
            mapPeekActions: [
              { id: 'pending_join', prominence: 'primary', joinRequestStatus: 'pending' },
            ],
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

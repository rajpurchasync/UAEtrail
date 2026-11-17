import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import { hostedExploreMapItem } from '../explore/exploreMapItemFixtures';
import { inferJoinUiStateFromDiscoveryCard } from './inferJoinUiStateFromDiscoveryCard';

describe('inferJoinUiStateFromDiscoveryCard', () => {
  it('prefers client join context over wire level', () => {
    const card = buildDiscoveryCardViewModelCard(
      hostedExploreMapItem({
        activity: { id: 'a1', title: 'Hike', activityType: 'hiking', status: 'published' },
      } as Parameters<typeof hostedExploreMapItem>[0])
    );
    const client = { kind: 'open' as const };
    expect(
      inferJoinUiStateFromDiscoveryCard(
        { ...card, viewerAccess: { ...card.viewerAccess!, level: 'participant' } },
        client
      )
    ).toBe(client);
  });

  it('infers pending from join_request level + pending_join wire', () => {
    const card = buildDiscoveryCardViewModelCard(
      hostedExploreMapItem({
        activity: { id: 'a1', title: 'Hike', activityType: 'hiking', status: 'published' },
      } as Parameters<typeof hostedExploreMapItem>[0])
    );
    const inferred = inferJoinUiStateFromDiscoveryCard({
      ...card,
      viewerAccess: {
        exposure: 'full',
        level: 'join_request',
        gateReason: null,
        canOpenDetailPage: true,
        canAccessCrewSurfaces: false,
        mapPeekActions: [
          { id: 'pending_join', prominence: 'primary', joinRequestStatus: 'pending' },
        ],
      },
    });
    expect(inferred).toEqual({
      kind: 'pending',
      requestId: 'wire',
      status: 'pending',
    });
  });

  it('does not invent pending from bare join_request (invite / no pending_join wire)', () => {
    const card = buildDiscoveryCardViewModelCard(
      hostedExploreMapItem({
        activity: { id: 'a1', title: 'Hike', activityType: 'hiking', status: 'published' },
      } as Parameters<typeof hostedExploreMapItem>[0])
    );
    expect(
      inferJoinUiStateFromDiscoveryCard({
        ...card,
        viewerAccess: {
          exposure: 'redacted',
          level: 'join_request',
          gateReason: null,
          canOpenDetailPage: true,
          canAccessCrewSurfaces: false,
          mapPeekActions: [{ id: 'request_join', prominence: 'primary' }],
        },
      })
    ).toBeUndefined();
  });

  it('infers waitlisted from pending_join wire', () => {
    const card = buildDiscoveryCardViewModelCard(
      hostedExploreMapItem({
        activity: { id: 'a1', title: 'Hike', activityType: 'hiking', status: 'published' },
      } as Parameters<typeof hostedExploreMapItem>[0])
    );
    expect(
      inferJoinUiStateFromDiscoveryCard({
        ...card,
        viewerAccess: {
          exposure: 'full',
          level: 'join_request',
          gateReason: null,
          canOpenDetailPage: true,
          canAccessCrewSurfaces: false,
          mapPeekActions: [
            { id: 'pending_join', prominence: 'primary', joinRequestStatus: 'waitlisted' },
          ],
        },
      })
    ).toEqual({
      kind: 'pending',
      requestId: 'wire',
      status: 'waitlisted',
    });
  });

  it('infers confirmed from participant level', () => {
    const card = buildDiscoveryCardViewModelCard(
      hostedExploreMapItem({
        activity: { id: 'a1', title: 'Hike', activityType: 'hiking', status: 'published' },
      } as Parameters<typeof hostedExploreMapItem>[0])
    );
    expect(
      inferJoinUiStateFromDiscoveryCard({
        ...card,
        viewerAccess: {
          exposure: 'full',
          level: 'participant',
          gateReason: null,
          canOpenDetailPage: true,
          canAccessCrewSurfaces: true,
          mapPeekActions: [{ id: 'open_crew_chat', prominence: 'primary' }],
        },
      })
    ).toEqual({ kind: 'confirmed', requestId: 'wire' });
  });
});
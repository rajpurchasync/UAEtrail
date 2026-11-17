import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import { hostedExploreMapItem } from '../explore/exploreMapItemFixtures';
import { ACTIVITY_STATUS_JOINED } from '../content/activityParticipationCopy';
import { resolveActivityPeekStatusChips } from './resolveActivityPeekStatusChips';

describe('resolveActivityPeekStatusChips', () => {
  it('shows Joined for confirmed participation', () => {
    const card = buildDiscoveryCardViewModelCard(
      hostedExploreMapItem({
        participantPreviews: [{ id: 'p1', name: 'You' }],
        activity: {
          id: 'a1',
          title: 'Run',
          activityType: 'event',
          status: 'published',
          participationMode: 'rsvp',
        },
      } as Parameters<typeof hostedExploreMapItem>[0])
    );
    const chips = resolveActivityPeekStatusChips(card, {
      kind: 'confirmed',
      requestId: 'r1',
    });
    expect(chips).toEqual([{ label: ACTIVITY_STATUS_JOINED, tone: 'joined' }]);
  });

  it('shows Pending from pending_join wire, not bare join_request', () => {
    const base = buildDiscoveryCardViewModelCard(
      hostedExploreMapItem({
        activity: {
          id: 'a2',
          title: 'Hike',
          activityType: 'hiking',
          status: 'published',
          participationMode: 'approval',
        },
      } as Parameters<typeof hostedExploreMapItem>[0])
    );
    const inviteOnly = {
      ...base,
      viewerAccess: {
        ...base.viewerAccess!,
        level: 'join_request' as const,
        mapPeekActions: [{ id: 'request_join' as const, prominence: 'primary' as const }],
      },
    };
    expect(resolveActivityPeekStatusChips(inviteOnly)).toEqual([]);

    const pending = {
      ...base,
      viewerAccess: {
        ...base.viewerAccess!,
        level: 'join_request' as const,
        mapPeekActions: [
          {
            id: 'pending_join' as const,
            prominence: 'primary' as const,
            joinRequestStatus: 'pending' as const,
          },
        ],
      },
    };
    expect(resolveActivityPeekStatusChips(pending)).toEqual([
      { label: 'Pending', tone: 'pending' },
    ]);
  });
});
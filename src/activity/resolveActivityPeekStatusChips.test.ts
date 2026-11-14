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

  it('shows Pending for join_request wire level', () => {
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
    const card = {
      ...base,
      viewerAccess: {
        ...base.viewerAccess!,
        level: 'join_request' as const,
      },
    };
    expect(resolveActivityPeekStatusChips(card)).toEqual([
      { label: 'Pending', tone: 'pending' },
    ]);
  });
});
import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import { hostedExploreMapItem } from '../explore/exploreMapItemFixtures';
import {
  ACTIVITY_STATUS_HOSTED,
  ACTIVITY_STATUS_JOINED,
  ACTIVITY_STATUS_JOIN_REQUESTED,
} from '../content/activityParticipationCopy';
import { resolveActivityPeekParticipationWidget } from './resolveActivityPeekParticipationWidget';

const activityCard = () =>
  buildDiscoveryCardViewModelCard(
    hostedExploreMapItem({
      activity: {
        id: 'a1',
        title: 'Trail',
        activityType: 'hiking',
        status: 'published',
        participationMode: 'approval',
      },
    } as Parameters<typeof hostedExploreMapItem>[0])
  );

describe('resolveActivityPeekParticipationWidget', () => {
  it('shows Hosted for host viewer (before join chips)', () => {
    const card = {
      ...activityCard(),
      viewerAccess: { ...(activityCard().viewerAccess ?? {}), level: 'host' as const },
    };
    expect(resolveActivityPeekParticipationWidget(card, { kind: 'confirmed', requestId: 'r' })).toEqual({
      label: ACTIVITY_STATUS_HOSTED,
      tone: 'host',
    });
  });

  it('shows Joined for confirmed participant', () => {
    const card = activityCard();
    expect(
      resolveActivityPeekParticipationWidget(card, { kind: 'confirmed', requestId: 'r1' })
    ).toEqual({
      label: ACTIVITY_STATUS_JOINED,
      tone: 'joined',
    });
  });

  it('shows Pending from pending join wire', () => {
    const base = activityCard();
    const card = {
      ...base,
      viewerAccess: {
        ...base.viewerAccess!,
        level: 'join_request' as const,
        mapPeekActions: [
          { id: 'pending_join' as const, prominence: 'primary' as const, joinRequestStatus: 'pending' as const },
        ],
      },
    };
    expect(resolveActivityPeekParticipationWidget(card)).toEqual({
      label: ACTIVITY_STATUS_JOIN_REQUESTED,
      tone: 'pending',
    });
  });
});
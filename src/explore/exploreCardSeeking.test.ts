import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreCardModel } from './exploreCardModel';

const seekingWithActivity = (): ExploreMapItemDTO =>
  ({
    id: 'activity:act-1',
    kind: 'hiking',
    source: 'activity',
    activityMode: 'seeking',
    title: 'Find crew',
    latitude: 25,
    longitude: 55,
    path: '/activity/act-1',
    participantIntentId: 'int-legacy',
    activity: {
      id: 'act-1',
      title: 'Find crew',
      activityType: 'hiking',
      joinMode: 'open',
    },
  }) as ExploreMapItemDTO;

describe('exploreCardModel seeking (R4.3)', () => {
  it('omits participantIntentId on card when published seeking activity exists', () => {
    const card = buildExploreCardModel(seekingWithActivity());
    expect(card.activityId).toBe('act-1');
    expect(card.participantIntentId).toBeNull();
    expect(card.sharePath).toMatch(/pin=activity(%3A|:)act-1/);
  });

  it('keeps participantIntentId for legacy demand-only wire rows', () => {
    const card = buildExploreCardModel({
      id: 'demand:int-only',
      kind: 'hiking',
      source: 'demand',
      activityMode: 'seeking',
      title: 'Legacy',
      latitude: 25,
      longitude: 55,
      path: '/explore',
      participantIntentId: 'int-only',
      requesterUserId: 'user-1',
    } as ExploreMapItemDTO);
    expect(card.participantIntentId).toBe('int-only');
  });
});

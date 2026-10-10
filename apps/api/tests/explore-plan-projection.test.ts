import { describe, expect, it } from 'vitest';
import {
  activityTypeToOutingCategory,
  buildExploreMapPlanProjection,
  deriveOutingTopicFromRequirements,
  mapItemMatchesOutingTopic,
  parseOutingTopic,
  exploreDemandMapItemPath,
  exploreSeekingMapItemPath,
  participantIntentKindToOutingCategory,
  resolveActivityOutingTopic,
  resolveOrganizeCreateKindFromDemandMapItem,
} from '@uaetrail/shared-types';

describe('explore plan projection mappers', () => {
  it('maps activity types to outing categories', () => {
    expect(activityTypeToOutingCategory('hiking')).toBe('hiking');
    expect(activityTypeToOutingCategory('rideshare')).toBe('rideshare');
    expect(activityTypeToOutingCategory('event')).toBe('events');
  });

  it('maps demand intent kinds to outing categories (find.event → activities)', () => {
    expect(participantIntentKindToOutingCategory('guide')).toBe('activities');
    expect(participantIntentKindToOutingCategory('other')).toBe('activities');
    expect(participantIntentKindToOutingCategory('event')).toBe('activities');
  });

  it('maps demand outing category to organize create kind for fulfill', () => {
    expect(
      resolveOrganizeCreateKindFromDemandMapItem({
        outingCategory: 'activities',
        kind: 'event',
      })
    ).toBe('activity');
    expect(
      resolveOrganizeCreateKindFromDemandMapItem({
        outingCategory: 'events',
        kind: 'event',
      })
    ).toBe('event');
  });

  it('builds explore path for demand map items', () => {
    expect(exploreDemandMapItemPath('abc')).toBe('/explore?pin=demand%3Aabc&list=1&panel=activities');
  });

  it('exploreSeekingMapItemPath prefers activity pin when activityId is set', () => {
    expect(
      exploreSeekingMapItemPath({ intentId: 'int-1', activityId: 'act-9' })
    ).toBe('/explore?pin=activity%3Aact-9&list=1&panel=activities');
  });

  it('prefers stored outing category over mapKind for activities', () => {
    const projection = buildExploreMapPlanProjection({
      source: 'activity',
      mapKind: 'event',
      storedOutingCategory: 'activities',
      participationMode: 'approval',
    });
    expect(projection.outingCategory).toBe('activities');
  });

  it('sets organize projection with participation mode', () => {
    const projection = buildExploreMapPlanProjection({
      source: 'activity',
      mapKind: 'hiking',
      participationMode: 'rsvp',
    });
    expect(projection).toEqual({
      composeIntent: 'organize',
      outingCategory: 'hiking',
      outingTopic: null,
      participationMode: 'rsvp',
    });
  });

  it('sets demand projection without participation mode', () => {
    const projection = buildExploreMapPlanProjection({
      source: 'demand',
      mapKind: 'event',
      demandIntentKind: 'guide',
    });
    expect(projection.composeIntent).toBe('demand');
    expect(projection.outingCategory).toBe('activities');
    expect(projection.participationMode).toBeNull();
  });

  it('maps activityMode seeking to demand compose intent (canonical wire)', () => {
    const projection = buildExploreMapPlanProjection({
      source: 'activity',
      activityMode: 'seeking',
      mapKind: 'hiking',
      demandIntentKind: 'hiking',
    });
    expect(projection.composeIntent).toBe('demand');
    expect(projection.outingCategory).toBe('hiking');
    expect(projection.participationMode).toBeNull();
  });

  it('sets find.event demand projection to activities outing category', () => {
    const projection = buildExploreMapPlanProjection({
      source: 'demand',
      mapKind: 'event',
      demandIntentKind: 'event',
    });
    expect(projection.outingCategory).toBe('activities');
  });

  it('parseOutingTopic and mapItemMatchesOutingTopic', () => {
    expect(parseOutingTopic('climbing')).toBe('climbing');
    expect(parseOutingTopic('invalid')).toBeNull();
    expect(
      mapItemMatchesOutingTopic(
        { outingCategory: 'activities', outingTopic: 'trail_run', source: 'activity' },
        'trail_run'
      )
    ).toBe(true);
    expect(
      mapItemMatchesOutingTopic({ source: 'venue', outingTopic: 'workshop' }, 'workshop')
    ).toBe(true);
    expect(
      mapItemMatchesOutingTopic({ outingCategory: 'events', outingTopic: 'workshop' }, 'workshop')
    ).toBe(false);
  });

  it('derives outing topic from activity type requirement line', () => {
    expect(
      deriveOutingTopicFromRequirements(['Activity type: Climb', 'Other'])
    ).toBe('climbing');
    expect(deriveOutingTopicFromRequirements(['Activity type: Run / jog'])).toBe('trail_run');
    expect(deriveOutingTopicFromRequirements(null)).toBeNull();
    expect(resolveActivityOutingTopic('workshop', ['Activity type: Climb'])).toBe('workshop');
    expect(resolveActivityOutingTopic(null, ['Activity type: Workshop'])).toBe('workshop');
  });

  it('leaves venue rows without plan fields', () => {
    const projection = buildExploreMapPlanProjection({
      source: 'venue',
      mapKind: 'hiking',
    });
    expect(projection.composeIntent).toBeNull();
    expect(projection.outingCategory).toBeNull();
  });
});

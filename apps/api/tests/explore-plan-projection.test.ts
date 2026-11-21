import { describe, expect, it } from 'vitest';
import {
  activityTypeToOutingCategory,
  buildExploreMapPlanProjection,
  canonicalizeMapComposeIntent,
  deriveOutingTopicFromRequirements,
  mapItemMatchesOutingTopic,
  parseOutingTopic,
  exploreSeekingMapItemPath,
  resolveSeekingExploreMapItemId,
  participantIntentKindToOutingCategory,
  resolveActivityOutingTopic,
  resolveHostCreateKindFromAvailabilityMapItem,
  resolveHostCreateKindFromSeekingMapItem,
} from '@uaetrail/shared-types';

describe('explore plan projection mappers', () => {
  it('accepts host/seek composeIntent only', () => {
    expect(canonicalizeMapComposeIntent('organize')).toBeNull();
    expect(canonicalizeMapComposeIntent('demand')).toBeNull();
    expect(canonicalizeMapComposeIntent('host')).toBe('host');
    expect(canonicalizeMapComposeIntent('seek')).toBe('seek');
    expect(canonicalizeMapComposeIntent('other')).toBeNull();
  });

  it('maps activity types to outing categories', () => {
    expect(activityTypeToOutingCategory('hiking')).toBe('hiking');
    expect(activityTypeToOutingCategory('rideshare')).toBe('rideshare');
    expect(activityTypeToOutingCategory('event')).toBe('events');
  });

  it('maps seeking intent kinds to outing categories (find.event → activities)', () => {
    expect(participantIntentKindToOutingCategory('guide')).toBe('activities');
    expect(participantIntentKindToOutingCategory('other')).toBe('activities');
    expect(participantIntentKindToOutingCategory('event')).toBe('activities');
  });

  it('maps availability (or legacy seeking) outing category to host create kind', () => {
    expect(
      resolveHostCreateKindFromAvailabilityMapItem({
        outingCategory: 'activities',
        kind: 'event',
      })
    ).toBe('activity');
    expect(
      resolveHostCreateKindFromAvailabilityMapItem({
        outingCategory: 'events',
        kind: 'event',
      })
    ).toBe('event');
    expect(
      resolveHostCreateKindFromSeekingMapItem({
        outingCategory: 'activities',
        kind: 'event',
      })
    ).toBe('activity');
  });

  it('does not mint leftover demand: pins from a bare intent id', () => {
    expect(resolveSeekingExploreMapItemId({ intentId: 'abc' })).toBeNull();
    expect(exploreSeekingMapItemPath({ intentId: 'abc' })).toBe('/explore?list=1&panel=activities');
    expect(resolveSeekingExploreMapItemId({ intentId: 'demand:abc' })).toBeNull();
    expect(exploreSeekingMapItemPath({ intentId: 'demand:abc' })).toBe(
      '/explore?list=1&panel=activities'
    );
  });

  it('exploreSeekingMapItemPath prefers activity pin when activityId is set', () => {
    expect(
      exploreSeekingMapItemPath({ intentId: 'int-1', activityId: 'act-9' })
    ).toBe('/explore?list=1&panel=activities&pin=activity%3Aact-9');
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

  it('sets host projection with participation mode', () => {
    const projection = buildExploreMapPlanProjection({
      source: 'activity',
      mapKind: 'hiking',
      participationMode: 'rsvp',
    });
    expect(projection).toEqual({
      composeIntent: 'host',
      outingCategory: 'hiking',
      outingTopic: null,
      participationMode: 'rsvp',
    });
  });

  it('sets seeking projection from activityMode', () => {
    const projection = buildExploreMapPlanProjection({
      source: 'activity',
      activityMode: 'seeking',
      mapKind: 'event',
      demandIntentKind: 'guide',
    });
    expect(projection.composeIntent).toBe('seek');
    expect(projection.outingCategory).toBe('activities');
    expect(projection.participationMode).toBeNull();
  });

  it('maps activityMode seeking to seek compose intent', () => {
    const projection = buildExploreMapPlanProjection({
      source: 'activity',
      activityMode: 'seeking',
      mapKind: 'hiking',
      demandIntentKind: 'hiking',
    });
    expect(projection.composeIntent).toBe('seek');
    expect(projection.outingCategory).toBe('hiking');
    expect(projection.participationMode).toBeNull();
  });

  it('sets find.event seeking projection to activities outing category', () => {
    const projection = buildExploreMapPlanProjection({
      source: 'activity',
      activityMode: 'seeking',
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

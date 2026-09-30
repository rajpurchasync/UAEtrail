import { describe, expect, it } from 'vitest';
import {
  activityTypeToOutingCategory,
  buildExploreMapPlanProjection,
  deriveOutingTopicFromRequirements,
  participantIntentKindToOutingCategory,
  resolveActivityOutingTopic,
} from '@uaetrail/shared-types';

describe('explore plan projection mappers', () => {
  it('maps activity types to outing categories', () => {
    expect(activityTypeToOutingCategory('hiking')).toBe('hiking');
    expect(activityTypeToOutingCategory('carpool')).toBe('rideshare');
    expect(activityTypeToOutingCategory('event')).toBe('events');
  });

  it('maps demand intent kinds including guide/other to activities', () => {
    expect(participantIntentKindToOutingCategory('guide')).toBe('activities');
    expect(participantIntentKindToOutingCategory('other')).toBe('activities');
    expect(participantIntentKindToOutingCategory('event')).toBe('events');
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

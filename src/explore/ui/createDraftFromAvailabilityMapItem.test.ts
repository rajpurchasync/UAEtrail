import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { createDraftFromAvailabilityMapItem } from './hostingFlowEngine';
import { availabilityExploreMapItem } from '../exploreMapItemFixtures';

const availabilityItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  availabilityExploreMapItem({
    kind: 'event',
    title: 'Sunday run crew',
    outingCategory: 'activities',
    ...overrides,
  });

describe('createDraftFromAvailabilityMapItem', () => {
  it('routes availability event pin to organize activity wizard', () => {
    const draft = createDraftFromAvailabilityMapItem(availabilityItem());
    expect(draft.kind).toBe('activity');
    expect(draft.meetingLatitude).toBe(25.1);
    expect(draft.meetingLongitude).toBe(55.2);
  });

  it('routes hiking availability pin with map coords to custom venue (no registry trap)', () => {
    const draft = createDraftFromAvailabilityMapItem(
      availabilityItem({
        kind: 'hiking',
        outingCategory: 'hiking',
        subtitle: 'Jebel Jais area',
      })
    );
    expect(draft.kind).toBe('hiking');
    expect(draft.placeLabelSource).toBe('custom');
    expect(draft.registryPlaceId).toBeNull();
    expect(draft.trailName).toBe('Jebel Jais area');
  });

  it('routes rideshare availability pin to carpool hosting flow', () => {
    const draft = createDraftFromAvailabilityMapItem(
      availabilityItem({
        kind: 'rideshare',
        outingCategory: 'rideshare',
        toLatitude: 25.2,
        toLongitude: 55.3,
      })
    );
    expect(draft.kind).toBe('rideshare');
  });
});
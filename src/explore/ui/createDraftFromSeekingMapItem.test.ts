import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { createDraftFromSeekingMapItem } from './organizeFlow';
import { seekingExploreMapItem } from '../exploreMapItemFixtures';

const seekingItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  seekingExploreMapItem({
    intentId: 'intent-1',
    kind: 'event',
    title: 'Sunday run crew',
    outingCategory: 'activities',
    ...overrides,
  });

describe('createDraftFromSeekingMapItem', () => {
  it('routes find.event (activities) seeking pin to organize activity wizard', () => {
    const draft = createDraftFromSeekingMapItem(seekingItem());
    expect(draft.kind).toBe('activity');
    expect(draft.meetingLatitude).toBe(25.1);
    expect(draft.meetingLongitude).toBe(55.2);
  });

  it('routes hiking seeking pin with map coords to custom venue (no registry trap)', () => {
    const draft = createDraftFromSeekingMapItem(
      seekingItem({
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

  it('routes rideshare seeking pin to carpool organize flow', () => {
    const draft = createDraftFromSeekingMapItem(
      seekingItem({
        kind: 'rideshare',
        outingCategory: 'rideshare',
        toLatitude: 25.2,
        toLongitude: 55.3,
      })
    );
    expect(draft.kind).toBe('rideshare');
  });
});

import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { createDraftFromDemand } from './organizeFlow';
import { seekingExploreMapItem } from '../exploreMapItemFixtures';

const demandItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  seekingExploreMapItem({
    intentId: 'intent-1',
    kind: 'event',
    title: 'Sunday run crew',
    outingCategory: 'activities',
    ...overrides,
  });

describe('createDraftFromDemand', () => {
  it('routes find.event (activities) demand to organize activity wizard', () => {
    const draft = createDraftFromDemand(demandItem());
    expect(draft.kind).toBe('activity');
    expect(draft.meetingLatitude).toBe(25.1);
    expect(draft.meetingLongitude).toBe(55.2);
  });

  it('routes hiking demand with pins to custom venue (no registry trap)', () => {
    const draft = createDraftFromDemand(
      demandItem({
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

  it('routes rideshare demand to carpool organize flow', () => {
    const draft = createDraftFromDemand(
      demandItem({
        kind: 'rideshare',
        outingCategory: 'rideshare',
        toLatitude: 25.2,
        toLongitude: 55.3,
      })
    );
    expect(draft.kind).toBe('rideshare');
  });
});

import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { canOfferRideshareForDemandItem } from './linkActivityRideshareOffer';
import { buildRideshareDraftFromDemandMapItem } from './linkRidesharePrefill';

const demandItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  ({
    id: 'demand:int-1',
    source: 'demand',
    kind: 'hiking',
    title: 'Jebel hike crew',
    path: '/explore',
    latitude: 25.1,
    longitude: 55.2,
    slotsTotal: 3,
    participantIntentId: 'int-1',
    ...overrides,
  }) as ExploreMapItemDTO;

describe('demand carpool offer', () => {
  it('allows carpool offer for hiking demand', () => {
    expect(canOfferRideshareForDemandItem(demandItem())).toBe(true);
    expect(canOfferRideshareForDemandItem(demandItem({ kind: 'rideshare' }))).toBe(false);
  });

  it('prefills rideshare draft from demand map item', () => {
    const draft = buildRideshareDraftFromDemandMapItem(demandItem());
    expect(draft.kind).toBe('rideshare');
    expect(draft.title).toContain('Jebel hike crew');
    expect(draft.latitude).toBe(25.1);
    expect(draft.capacity).toBe(3);
  });
});

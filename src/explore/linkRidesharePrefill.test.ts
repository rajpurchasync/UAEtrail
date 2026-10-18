import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { canOfferRideshareForSeekingItem, canShowSeekingLinkRideshareOffer } from './linkActivityRideshareOffer';
import { buildRideshareDraftFromSeekingMapItem } from './linkRidesharePrefill';
import { seekingExploreMapItem } from './exploreMapItemFixtures';

const demandItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  seekingExploreMapItem({
    intentId: 'int-1',
    kind: 'hiking',
    title: 'Jebel hike crew',
    slotsTotal: 3,
    ...overrides,
  });

describe('demand carpool offer', () => {
  it('allows carpool offer for hiking demand', () => {
    expect(canOfferRideshareForSeekingItem(demandItem())).toBe(true);
    expect(canOfferRideshareForSeekingItem(demandItem({ kind: 'rideshare' }))).toBe(false);
  });

  it('requires wire canOfferTransport for demand link rideshare CTA', () => {
    expect(canShowSeekingLinkRideshareOffer(demandItem())).toBe(false);
    expect(
      canShowSeekingLinkRideshareOffer(
        demandItem({
          viewerAccess: {
            level: 'host',
            exposure: 'full',
            gateReason: null,
            canAccessCrewSurfaces: true,
            entitlements: {
              isProMember: true,
              canViewHostProfileBeforeJoin: true,
              canViewFullBuddyRoster: true,
              canOfferTransport: true,
              canAddLinkedRide: true,
              canMessageHostBeforeJoin: true,
              buddyUserIdsOnActivity: [],
            },
          },
        })
      )
    ).toBe(true);
  });

  it('prefills rideshare draft from demand map item', () => {
    const draft = buildRideshareDraftFromSeekingMapItem(demandItem());
    expect(draft.kind).toBe('rideshare');
    expect(draft.title).toContain('Jebel hike crew');
    expect(draft.latitude).toBe(25.1);
    expect(draft.capacity).toBe(3);
  });
});

import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { canOfferRideshareForDemandItem, canShowDemandLinkRideshareOffer } from './linkActivityRideshareOffer';
import { buildRideshareDraftFromDemandMapItem } from './linkRidesharePrefill';
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
    expect(canOfferRideshareForDemandItem(demandItem())).toBe(true);
    expect(canOfferRideshareForDemandItem(demandItem({ kind: 'rideshare' }))).toBe(false);
  });

  it('requires wire canOfferTransport for demand link rideshare CTA', () => {
    expect(canShowDemandLinkRideshareOffer(demandItem())).toBe(false);
    expect(
      canShowDemandLinkRideshareOffer(
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
    const draft = buildRideshareDraftFromDemandMapItem(demandItem());
    expect(draft.kind).toBe('rideshare');
    expect(draft.title).toContain('Jebel hike crew');
    expect(draft.latitude).toBe(25.1);
    expect(draft.capacity).toBe(3);
  });
});

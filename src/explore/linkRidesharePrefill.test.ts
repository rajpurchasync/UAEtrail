import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  canOfferRideshareForAvailabilityItem,
  canShowAvailabilityLinkRideshareOffer,
} from './linkActivityRideshareOffer';
import { buildRideshareDraftFromAvailabilityMapItem } from './linkRidesharePrefill';
import { availabilityExploreMapItem, seekingExploreMapItem } from './exploreMapItemFixtures';

const availabilityItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  availabilityExploreMapItem({
    title: 'Jebel hike crew',
    slotsTotal: 3,
    ...overrides,
  });

const legacySeekingItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  seekingExploreMapItem({
    intentId: 'int-1',
    kind: 'hiking',
    title: 'Jebel hike crew',
    slotsTotal: 3,
    ...overrides,
  });

describe('demand carpool offer', () => {
  it('allows carpool offer for hiking availability pins', () => {
    expect(canOfferRideshareForAvailabilityItem(availabilityItem())).toBe(true);
    expect(canOfferRideshareForAvailabilityItem(availabilityItem({ kind: 'rideshare' }))).toBe(false);
  });

  it('still allows carpool offer for legacy seeking activity pins', () => {
    expect(canOfferRideshareForAvailabilityItem(legacySeekingItem())).toBe(true);
  });

  it('requires wire canOfferTransport for demand link rideshare CTA', () => {
    expect(canShowAvailabilityLinkRideshareOffer(availabilityItem())).toBe(false);
    expect(
      canShowAvailabilityLinkRideshareOffer(
        availabilityItem({
          viewerAccess: {
            level: 'host',
            exposure: 'full',
            gateReason: null,
            canAccessCrewSurfaces: true,
            entitlements: {
              isProMember: true,
              canViewHostProfileBeforeJoin: true,
              canViewFullFriendRoster: true,
              canOfferTransport: true,
              canAddLinkedRide: true,
              canMessageHostBeforeJoin: true,
              friendUserIdsOnActivity: [],
            },
          },
        })
      )
    ).toBe(true);
  });

  it('prefills rideshare draft from availability map item', () => {
    const draft = buildRideshareDraftFromAvailabilityMapItem(availabilityItem());
    expect(draft.kind).toBe('rideshare');
    expect(draft.title).toContain('Jebel hike crew');
    expect(draft.latitude).toBe(25.1);
    expect(draft.capacity).toBe(3);
  });
});
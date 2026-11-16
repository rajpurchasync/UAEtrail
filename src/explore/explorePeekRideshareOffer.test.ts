import { describe, expect, it, vi } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { availabilityPeekShowsOfferRideshare, runPeekOfferRideshare } from './explorePeekRideshareOffer';
import { availabilityExploreMapItem } from './exploreMapItemFixtures';

describe('explorePeekRideshareOffer', () => {
  it('routes offer to availability handler for catalog pins', () => {
    const onOffer = vi.fn();
    const item = availabilityExploreMapItem({
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
    });
    runPeekOfferRideshare({
      selected: item,
      activity: undefined,
      onOfferRideshareForAvailability: onOffer,
    });
    expect(onOffer).toHaveBeenCalledOnce();
  });

  it('gates availability peek offer on canOfferTransport', () => {
    expect(availabilityPeekShowsOfferRideshare(availabilityExploreMapItem())).toBe(false);
    expect(
      availabilityPeekShowsOfferRideshare(
        availabilityExploreMapItem({
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
        } as Partial<ExploreMapItemDTO>)
      )
    ).toBe(true);
  });
});
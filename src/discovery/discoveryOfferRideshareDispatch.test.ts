import { describe, expect, it, vi } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  discoverySelectionShowsOfferRideshare,
  dispatchOfferRideshareFromSelection,
} from './discoveryOfferRideshareDispatch';
import { availabilityExploreMapItem } from '../explore/exploreMapItemFixtures';

describe('discoveryOfferRideshareDispatch', () => {
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
    dispatchOfferRideshareFromSelection({
      selected: item,
      activity: undefined,
      onOfferRideshareForAvailability: onOffer,
    });
    expect(onOffer).toHaveBeenCalledOnce();
  });

  it('gates summary offer on canOfferTransport', () => {
    expect(discoverySelectionShowsOfferRideshare(availabilityExploreMapItem())).toBe(false);
    expect(
      discoverySelectionShowsOfferRideshare(
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
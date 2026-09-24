import { describe, expect, it } from 'vitest';
import { api } from './services';

/** Legacy `api.*` names live in `legacyApi.ts`; domain modules stay canonical-only. */
describe('api domain aliases (Phase 1)', () => {
  it('exposes place admin aliases alongside legacy location methods', () => {
    expect(typeof api.getAdminPlaces).toBe('function');
    expect(typeof api.getAdminLocations).toBe('function');
    expect(typeof api.createAdminPlace).toBe('function');
    expect(typeof api.createAdminLocation).toBe('function');
    expect(typeof api.updateAdminPlace).toBe('function');
    expect(typeof api.deleteAdminPlace).toBe('function');
  });

  it('exposes public place browse aliases alongside legacy location methods', () => {
    expect(typeof api.getPublicPlaces).toBe('function');
    expect(typeof api.getPublicLocations).toBe('function');
    expect(typeof api.getPublicPlaceDetail).toBe('function');
    expect(typeof api.getPublicLocationDetail).toBe('function');
    expect(typeof api.getPopularPlaces).toBe('function');
    expect(typeof api.getPopularLocations).toBe('function');
    expect(typeof api.trackPlaceView).toBe('function');
    expect(typeof api.trackLocationView).toBe('function');
    expect(typeof api.getPlaceActivities).toBe('function');
    expect(typeof api.getLocationActivities).toBe('function');
    expect(typeof api.checkoutPlacePremium).toBe('function');
    expect(typeof api.checkoutLocationPremium).toBe('function');
    expect(typeof api.getPlaceGuide).toBe('function');
    expect(typeof api.getLocationGuide).toBe('function');
  });

  it('exposes place review aliases alongside legacy location review methods', () => {
    expect(typeof api.getPlaceReviews).toBe('function');
    expect(typeof api.getOrganisationReviews).toBe('function');
    expect(typeof api.getReviews).toBe('function');
    expect(typeof api.createPlaceReview).toBe('function');
    expect(typeof api.createOrganisationReview).toBe('function');
    expect(typeof api.createReview).toBe('function');
    expect(typeof api.getMyReviews).toBe('function');
    expect(typeof api.updateMyReview).toBe('function');
  });

  it('exposes host place submission aliases alongside legacy methods', () => {
    expect(typeof api.submitPlace).toBe('function');
    expect(typeof api.submitOrganisationPlace).toBe('function');
    expect(typeof api.submitLocation).toBe('function');
    expect(typeof api.getOrganisationSubmittedPlaces).toBe('function');
    expect(typeof api.getHostSubmittedPlaces).toBe('function');
    expect(typeof api.getHostSubmittedLocations).toBe('function');
    expect(typeof api.submitUserPlace).toBe('function');
    expect(typeof api.getMySubmittedPlaces).toBe('function');
  });

  it('exposes organisation aliases alongside legacy tenant/merchant methods', () => {
    expect(typeof api.getOrganisationProfile).toBe('function');
    expect(typeof api.getTenantProfile).toBe('function');
    expect(typeof api.getShopOrganisationProfile).toBe('function');
    expect(typeof api.getShopOrganisationProfileById).toBe('function');
    expect(typeof api.getMerchantProfileById).toBe('function');
    expect(typeof api.getShopOrganisationStores).toBe('function');
    expect(typeof api.createShopOrganisationProfile).toBe('function');
    expect(typeof api.updateShopOrganisationProfile).toBe('function');
  });

  it('exposes person profile alias alongside legacy user public profile method', () => {
    expect(typeof api.getPersonPublicProfile).toBe('function');
    expect(typeof api.getUserPublicProfile).toBe('function');
  });

  it('exposes admin member and organisation application aliases', () => {
    expect(typeof api.getAdminMembers).toBe('function');
    expect(typeof api.getAdminUsers).toBe('function');
    expect(typeof api.getAdminOrganisationApplications).toBe('function');
    expect(typeof api.getAdminApplications).toBe('function');
    expect(typeof api.submitOrganisationApplication).toBe('function');
    expect(typeof api.getMyOrganisationApplication).toBe('function');
  });

  it('exposes organisation console aliases alongside legacy host methods', () => {
    expect(typeof api.getMyOrganisationStatus).toBe('function');
    expect(typeof api.getMyHostStatus).toBe('function');
    expect(typeof api.listOrganisationActivities).toBe('function');
    expect(typeof api.listHostActivities).toBe('function');
    expect(typeof api.getOrganisationJoinRequests).toBe('function');
    expect(typeof api.getHostRequests).toBe('function');
    expect(typeof api.decideOrganisationJoinRequest).toBe('function');
    expect(typeof api.decideHostRequest).toBe('function');
    expect(typeof api.getOrganisationTeam).toBe('function');
    expect(typeof api.getHostTeam).toBe('function');
    expect(typeof api.createOrganisationTeamMember).toBe('function');
    expect(typeof api.publishOrganisationActivity).toBe('function');
    expect(typeof api.publishHostActivity).toBe('function');
    expect(typeof api.cancelOrganisationActivity).toBe('function');
  });

  it('exposes shop public alias alongside legacy merchant public method', () => {
    expect(typeof api.getShopPublic).toBe('function');
    expect(typeof api.getShopOrganisationPublic).toBe('function');
    expect(typeof api.getMerchantPublic).toBe('function');
  });

  it('exposes shop organisation product aliases alongside legacy merchant product methods', () => {
    expect(typeof api.getShopOrganisationProducts).toBe('function');
    expect(typeof api.getMerchantProducts).toBe('function');
    expect(typeof api.addShopOrganisationProduct).toBe('function');
    expect(typeof api.updateShopOrganisationProduct).toBe('function');
    expect(typeof api.deleteShopOrganisationProduct).toBe('function');
    expect(typeof api.updateOrganisationDetails).toBe('function');
    expect(typeof api.updateHostDetails).toBe('function');
  });
});

/**
 * Deprecated `api.*` names — thin aliases to canonical domain methods.
 * App code must use Organisation / Place / Member names; see `apiLegacyGuard.test.ts`.
 */
import {
  placeApi,
  activitiesApi,
  accountApi,
  memberApi,
  organisationApi,
  shopApi,
  adminApi,
} from './domains';

export const legacyApi = {
  // Place / location
  getPublicLocations: placeApi.getPublicPlaces,
  getLocationsPage: placeApi.getPlacesPage,
  getPublicLocationDetail: placeApi.getPublicPlaceDetail,
  getLocationGuide: placeApi.getPlaceGuide,
  checkoutLocationPremium: placeApi.checkoutPlacePremium,
  downloadLocationRouteMap: placeApi.downloadPlaceRouteMap,
  downloadLocationGuidePdf: placeApi.downloadPlaceGuidePdf,
  getLocationActivities: placeApi.getPlaceActivities,
  getPopularLocations: placeApi.getPopularPlaces,
  trackLocationView: placeApi.trackPlaceView,
  getAdminLocations: placeApi.getAdminPlaces,
  createAdminLocation: placeApi.createAdminPlace,
  updateAdminLocation: placeApi.updateAdminPlace,
  deleteAdminLocation: placeApi.deleteAdminPlace,
  submitHostPlace: placeApi.submitOrganisationPlace,
  submitLocation: placeApi.submitLocation,
  getHostSubmittedPlaces: placeApi.getOrganisationSubmittedPlaces,
  getHostSubmittedLocations: placeApi.getHostSubmittedLocations,
  submitUserLocation: placeApi.submitUserLocation,
  getMySubmittedLocations: placeApi.getMySubmittedLocations,

  // Organisation / host
  getTenantProfile: organisationApi.getOrganisationProfile,
  getHostRequests: organisationApi.getOrganisationJoinRequests,
  decideHostRequest: organisationApi.decideOrganisationJoinRequest,
  getHostTeam: organisationApi.getOrganisationTeam,
  createHostTeamMember: organisationApi.createOrganisationTeamMember,
  updateHostTeamMemberRole: organisationApi.updateOrganisationTeamMemberRole,
  toggleHostTeamMemberStatus: organisationApi.toggleOrganisationTeamMemberStatus,
  removeHostTeamMember: organisationApi.removeOrganisationTeamMember,
  submitHostApplication: organisationApi.submitOrganisationApplication,
  getMyHostApplication: organisationApi.getMyOrganisationApplication,
  getMyHostStatus: memberApi.getMemberHostStatus,
  updateHostDetails: organisationApi.updateOrganisationDetails,

  // Activities
  listHostActivities: activitiesApi.listOrganisationActivities,
  createHostActivity: activitiesApi.createOrganisationActivity,
  updateHostActivity: activitiesApi.updateOrganisationActivity,
  publishHostActivity: activitiesApi.publishOrganisationActivity,
  duplicateHostActivity: activitiesApi.duplicateOrganisationActivity,
  cancelHostActivity: activitiesApi.cancelOrganisationActivity,

  // Person / account
  getUserPublicProfile: accountApi.getPersonPublicProfile,

  // Admin
  getAdminApplications: adminApi.getAdminOrganisationApplications,
  getAdminUsers: adminApi.getAdminMembers,
  getAdminUserDetail: adminApi.getAdminMemberDetail,
  updateAdminUserStatus: adminApi.updateAdminMemberStatus,

  // Shop / merchant
  getMerchantProfileById: shopApi.getShopOrganisationProfileById,
  getMerchantProducts: shopApi.getShopOrganisationProducts,
  getMerchantPublic: shopApi.getShopOrganisationPublic,
  updateMerchantProduct: shopApi.updateShopOrganisationProduct,
  deleteMerchantProduct: shopApi.deleteShopOrganisationProduct,
} as const;

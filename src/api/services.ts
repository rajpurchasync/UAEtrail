import { PlaceDTO } from '@uaetrail/shared-types';
import {
  placeApi,
  facilityApi,
  areasApi,
  fetchPlaceCatalog,
  exploreApi,
  seekingApi,
  badgesApi,
  memberCommitmentHubApi,
  memberJourneyMapApi,
  activitiesApi,
  accountApi,
  buddiesApi,
  groupsApi,
  wishlistApi,
  entityFollowApi,
  reviewsApi,
  safetyApi,
  memberApi,
  organisationApi,
  publishingWorkspaceApi,
  shopApi,
  adminApi,
  chatApi,
  mediaApi,
} from './domains';

export * from './types';

export const api = {
  ...placeApi,
  ...facilityApi,
  ...areasApi,
  fetchPlaceCatalog,
  ...exploreApi,
  ...seekingApi,
  ...badgesApi,
  ...memberCommitmentHubApi,
  ...memberJourneyMapApi,
  ...activitiesApi,
  ...accountApi,
  ...buddiesApi,
  ...groupsApi,
  ...wishlistApi,
  ...entityFollowApi,
  ...reviewsApi,
  ...safetyApi,
  ...memberApi,
  ...organisationApi,
  ...publishingWorkspaceApi,
  ...shopApi,
  ...adminApi,
  ...chatApi,
  ...mediaApi,

  /** Tenant workspace place submit (`/publishing/places`). */
  submitPlace(tenantId: string, payload: Partial<PlaceDTO>) {
    return publishingWorkspaceApi.submitOrganisationPlace(tenantId, payload);
  },
};

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
  ...shopApi,
  ...adminApi,
  ...chatApi,
  ...mediaApi,

  /** Alias for {@link placeApi.submitOrganisationPlace} — used by compose / submit-place flows. */
  submitPlace(tenantId: string, payload: Partial<PlaceDTO>) {
    return this.submitOrganisationPlace(tenantId, payload);
  },
};

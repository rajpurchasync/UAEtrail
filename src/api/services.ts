import { PlaceDTO } from '@uaetrail/shared-types';
import {
  placeApi,
  facilityApi,
  areasApi,
  fetchPlaceRegistry,
  exploreApi,
  badgesApi,
  memberCommitmentHubApi,
  memberJourneyMapApi,
  activitiesApi,
  accountApi,
  socialApi,
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
  fetchPlaceRegistry,
  ...exploreApi,
  ...badgesApi,
  ...memberCommitmentHubApi,
  ...memberJourneyMapApi,
  ...activitiesApi,
  ...accountApi,
  ...socialApi,
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

import { PlaceDTO } from '@uaetrail/shared-types';
import {
  placeApi,
  areasApi,
  fetchPlaceRegistry,
  exploreApi,
  badgesApi,
  goalsApi,
  availabilityApi,
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
  ...areasApi,
  fetchPlaceRegistry,
  ...exploreApi,
  ...badgesApi,
  ...goalsApi,
  ...availabilityApi,
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

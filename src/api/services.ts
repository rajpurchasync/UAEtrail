import { PlaceDTO } from '@uaetrail/shared-types';
import {
  placeApi,
  exploreApi,
  rewardsApi,
  activitiesApi,
  accountApi,
  socialApi,
  organisationApi,
  shopApi,
  adminApi,
  chatApi,
  mediaApi,
} from './domains';

import { legacyApi } from './legacyApi';

export * from './types';

export const api = {
  ...placeApi,
  ...exploreApi,
  ...rewardsApi,
  ...activitiesApi,
  ...accountApi,
  ...socialApi,
  ...organisationApi,
  ...shopApi,
  ...adminApi,
  ...chatApi,
  ...mediaApi,
  ...legacyApi,

  /** Alias for {@link placeApi.submitOrganisationPlace} — used by compose / submit-place flows. */
  submitPlace(tenantId: string, payload: Partial<PlaceDTO>) {
    return this.submitOrganisationPlace(tenantId, payload);
  },
};

import {
  ADMIN_FACILITIES_PATH,
  ADMIN_PLACES_PATH,
} from '../lib/member-routes.js';
import { notifyPlatformAdmins } from './admin-notifications.js';

export type CatalogSubmitKind = 'place' | 'facility';

export const notifyAdminsCatalogSubmitted = (input: {
  kind: CatalogSubmitKind;
  entityId: string;
  name: string;
  /** Place wire label (hiking, event, …) or facility kind. */
  catalogLabel: string;
  submitterLabel: string;
}): void => {
  const isFacility = input.kind === 'facility';
  void notifyPlatformAdmins({
    title: isFacility ? 'Facility submitted for review' : 'Place submitted for review',
    body: `${input.submitterLabel} submitted "${input.name}" (${input.catalogLabel}) — review in ${
      isFacility ? 'Facilities' : 'Places'
    }.`,
    meta: {
      kind: isFacility ? 'facility_submitted' : 'location_submitted',
      ...(isFacility ? { facilityId: input.entityId } : { locationId: input.entityId }),
      path: isFacility ? ADMIN_FACILITIES_PATH : ADMIN_PLACES_PATH,
    },
  });
};

/** @deprecated Use {@link notifyAdminsCatalogSubmitted} with `kind: 'place'`. */
export const notifyAdminsLocationSubmitted = (input: {
  locationId: string;
  name: string;
  activityType: string;
  submitterLabel: string;
}): void => {
  notifyAdminsCatalogSubmitted({
    kind: 'place',
    entityId: input.locationId,
    name: input.name,
    catalogLabel: input.activityType,
    submitterLabel: input.submitterLabel,
  });
};

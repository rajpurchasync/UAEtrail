import type { Location } from '../domain/types.js';
import { LocationStatus } from '../domain/enums.js';
import { listAdminPlacesPaged } from '../lib/admin-store.js';
import { listSubmittedLocationsByUser } from '../lib/activities-store.js';
import { listActiveLocations } from '../lib/location-query.js';
import { toLocationDto } from '../lib/mappers.js';
import { locationHasRegistryCoverImage } from '../lib/catalog-registry-cover.js';
import type { LocationDTO } from '@uaetrail/shared-types';

export type PlaceRegistryQuery = {
  activityType?: 'hiking' | 'camping' | 'event';
  countryCode?: string;
  userId?: string | null;
  platformAdmin?: boolean;
};

const mergeById = (lists: Location[][]): Location[] => {
  const byId = new Map<string, Location>();
  for (const list of lists) {
    for (const place of list) {
      if (place?.id) byId.set(place.id, place);
    }
  }
  return [...byId.values()];
};

const matchesActivityType = (
  place: Location,
  activityType?: PlaceRegistryQuery['activityType']
): boolean => {
  if (!activityType) return true;
  const kind = String(place.activityType).toLowerCase();
  if (activityType === 'event') {
    return kind === 'event' || kind === 'community_activity';
  }
  return kind === activityType;
};

/** Server-side merge for venue pickers (organize + host console). */
export const buildPlaceRegistry = async (
  query: PlaceRegistryQuery = {}
): Promise<LocationDTO[]> => {
  const { activityType, countryCode, userId, platformAdmin } = query;

  const published = await listActiveLocations({
    activityType,
    countryCode,
    page: 1,
    pageSize: 500,
  });

  const lists: Location[][] = [published.items];

  if (userId) {
    const submitted = await listSubmittedLocationsByUser(userId);
    lists.push(
      submitted.filter(
        (place) =>
          place.status === LocationStatus.DRAFT && matchesActivityType(place, activityType)
      )
    );
  }

  if (platformAdmin) {
    const { items: adminPlaces } = await listAdminPlacesPaged({
      skip: 0,
      take: 500,
    });
    lists.push(adminPlaces.filter((place) => matchesActivityType(place, activityType)));
  }

  const merged = mergeById(lists)
    .filter((place) => locationHasRegistryCoverImage(place) || place.status === LocationStatus.DRAFT)
    .sort((a, b) => a.name.localeCompare(b.name));
  return merged.map((place) => toLocationDto(place));
};

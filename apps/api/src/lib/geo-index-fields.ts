import { resolveGroupRegionBrowseKey, type GroupRegionLevels } from '@uaetrail/shared-types';
import type { Location } from '../domain/types.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { resolveActivityAnchorCoordinates } from './area-resolution.js';
import { type GeoPoint, withGeoPointOnDoc } from './location-geo.js';

export type GeoIndexFields = {
  groupRegionBrowseKey: string | null;
  geo?: GeoPoint;
};

export const groupRegionBrowseKeyForCountry = (
  countryCode: string,
  levels: GroupRegionLevels | null | undefined
): string | null => resolveGroupRegionBrowseKey(countryCode, levels);

export const locationGeoIndexFields = (location: Pick<Location, 'countryCode' | 'groupRegionLevels' | 'latitude' | 'longitude'>): GeoIndexFields => ({
  groupRegionBrowseKey: groupRegionBrowseKeyForCountry(location.countryCode, location.groupRegionLevels),
  ...withGeoPointOnDoc(location.latitude, location.longitude),
});

export const activityGeoIndexFields = (
  doc: Pick<
    MongoActivityDoc,
    | 'groupRegionLevels'
    | 'meetingLat'
    | 'meetingLng'
    | 'startLat'
    | 'startLng'
    | 'parkingLat'
    | 'parkingLng'
  >,
  countryCode: string,
  location?: Pick<Location, 'latitude' | 'longitude'> | null
): GeoIndexFields => {
  const anchor = resolveActivityAnchorCoordinates(doc, location);
  return {
    groupRegionBrowseKey: groupRegionBrowseKeyForCountry(countryCode, doc.groupRegionLevels),
    ...(anchor ? withGeoPointOnDoc(anchor.latitude, anchor.longitude) : {}),
  };
};

export const tenantGeoIndexFields = (tenant: {
  countryCode: string;
  groupRegionLevels?: GroupRegionLevels | null;
  latitude?: number | null;
  longitude?: number | null;
}): GeoIndexFields => ({
  groupRegionBrowseKey: groupRegionBrowseKeyForCountry(tenant.countryCode, tenant.groupRegionLevels),
  ...withGeoPointOnDoc(tenant.latitude, tenant.longitude),
});

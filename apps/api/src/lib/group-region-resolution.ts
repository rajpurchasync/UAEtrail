import type { AreaDTO, GroupRegionLevels } from '@uaetrail/shared-types';
import { normalizeGroupRegionLabel, stampGroupRegionLevelsFromGeo } from '@uaetrail/shared-types';
import type { Location } from '../domain/types.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { listPublishedDestinations } from './destinations-store.js';
import { resolveActivityAnchorCoordinates } from './destination-resolution.js';
import { reversePlaceLocality } from './place-search.js';
import type { TenantRecord } from './tenant-store.js';

let publishedAreasCache: AreaDTO[] | null = null;
let publishedAreasCacheAt = 0;
const CACHE_MS = 60_000;

const loadPublishedAreasCached = async (): Promise<AreaDTO[]> => {
  const now = Date.now();
  if (publishedAreasCache && now - publishedAreasCacheAt < CACHE_MS) {
    return publishedAreasCache;
  }
  publishedAreasCache = await listPublishedDestinations();
  publishedAreasCacheAt = now;
  return publishedAreasCache;
};

export const invalidatePublishedAreasGroupRegionCache = (): void => {
  publishedAreasCache = null;
  publishedAreasCacheAt = 0;
};

const stampLevels = async (input: {
  countryCode: string;
  region?: string | null;
  areaLabel?: string | null;
  existing?: GroupRegionLevels | null;
  stateHint?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  areaId?: string | null;
}): Promise<GroupRegionLevels> => {
  const publishedAreas = await loadPublishedAreasCached();
  const stamped = stampGroupRegionLevelsFromGeo({
    ...input,
    countryCode: input.countryCode?.trim() ? input.countryCode : 'AE',
    publishedAreas,
  });
  const lat = input.latitude;
  const lng = input.longitude;
  if (lat == null || lng == null) return stamped;
  if (process.env.VITEST) return stamped;
  const geo = await reversePlaceLocality(lat, lng);
  if (!geo) return stamped;
  const city = geo.city?.trim() || null;
  const l2 =
    stamped.l2?.trim() ||
    (geo.state ? normalizeGroupRegionLabel(geo.state) : null) ||
    (city ? normalizeGroupRegionLabel(city) : null) ||
    null;
  const l3 = stamped.l3?.trim() || city || null;
  const l4 = stamped.l4?.trim() || geo.community?.trim() || null;
  return { ...stamped, l2, l3, l4 };
};

export const stampGroupRegionLevelsForPin = stampLevels;

export const stampLocationGroupRegionLevels = async (location: Location): Promise<Location> => {
  const groupRegionLevels = await stampLevels({
    countryCode: location.countryCode,
    region: location.region,
    areaLabel: location.areaLabel,
    existing: location.groupRegionLevels,
    latitude: location.latitude,
    longitude: location.longitude,
    areaId: location.areaId,
  });
  return { ...location, groupRegionLevels };
};

export const resolveGroupRegionLevelsForActivityDoc = async (
  doc: Pick<
    MongoActivityDoc,
    'meetingLat' | 'meetingLng' | 'startLat' | 'startLng' | 'parkingLat' | 'parkingLng' | 'groupRegionLevels'
  >,
  location?: Pick<
    Location,
    'latitude' | 'longitude' | 'groupRegionLevels' | 'region' | 'areaId' | 'areaLabel' | 'countryCode'
  > | null
): Promise<GroupRegionLevels> => {
  const anchor = resolveActivityAnchorCoordinates(doc, location);
  return stampLevels({
    countryCode: location?.countryCode ?? 'AE',
    region: location?.region,
    areaLabel: location?.areaLabel,
    existing: doc.groupRegionLevels ?? location?.groupRegionLevels,
    latitude: anchor?.latitude ?? location?.latitude,
    longitude: anchor?.longitude ?? location?.longitude,
    areaId: location?.areaId,
  });
};

export const stampTenantGroupRegionLevels = async (tenant: TenantRecord): Promise<TenantRecord> => {
  const groupRegionLevels = await stampLevels({
    countryCode: tenant.countryCode,
    region: tenant.region,
    existing: tenant.groupRegionLevels,
    latitude: tenant.latitude,
    longitude: tenant.longitude,
  });
  return { ...tenant, groupRegionLevels };
};

/** @deprecated Use stampLocationGroupRegionLevels */
export const stampLocationGroupRegion = stampLocationGroupRegionLevels;


/** @deprecated Use stampTenantGroupRegionLevels */
export const stampTenantGroupRegion = stampTenantGroupRegionLevels;

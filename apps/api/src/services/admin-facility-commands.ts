import type { FacilityKind } from '@uaetrail/shared-types';
import { mergeVenueAreaTag, tagsForPlaceKind } from '@uaetrail/shared-types';
import { LocationStatus } from '../domain/enums.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import {
  createAdminFacility,
  deleteAdminFacility,
  findFacilityById,
  updateAdminFacility,
} from '../lib/facilities-store.js';
import { toFacilityDto } from '../lib/facility-mappers.js';
import { scheduleExploreMapCacheInvalidation } from '../lib/explore-map.js';

export type AdminFacilityWriteInput = {
  name: string;
  region: string;
  areaLabel?: string | null;
  areaId: string;
  facilityKind: FacilityKind;
  parentPlaceId?: string | null;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  images: string[];
  tags?: string[];
  featured?: boolean;
  status?: 'draft' | 'active' | 'inactive';
  countryCode?: string;
  partnerReferralUrl?: string | null;
};

const toPrismaLocationStatus = (status?: 'draft' | 'active' | 'inactive'): LocationStatus => {
  if (status === 'draft') return LocationStatus.DRAFT;
  return status === 'inactive' ? LocationStatus.INACTIVE : LocationStatus.ACTIVE;
};

export const createAdminFacilityRecord = async (input: {
  actorId: string;
  body: AdminFacilityWriteInput;
}) => {
  const body = input.body;
  const areaLabel = body.areaLabel?.trim() || null;
  const tags = mergeVenueAreaTag(
    [...tagsForPlaceKind(body.facilityKind), ...(body.tags ?? [])],
    areaLabel
  );

  const facility = await createAdminFacility({
    name: body.name,
    region: body.region,
    areaLabel,
    areaId: body.areaId.trim(),
    facilityKind: body.facilityKind,
    parentPlaceId: body.parentPlaceId?.trim() || null,
    description: body.description,
    latitude: body.latitude,
    longitude: body.longitude,
    images: body.images,
    tags,
    featured: body.featured ?? false,
    status: toPrismaLocationStatus(body.status),
    countryCode: body.countryCode?.toUpperCase() ?? 'AE',
    partnerReferralUrl: body.partnerReferralUrl?.trim() || null,
    createdByUserId: input.actorId,
  });

  await createAuditLog({
    actorId: input.actorId,
    action: 'facility.create',
    entityType: 'facility',
    entityId: facility.id,
  });
  scheduleExploreMapCacheInvalidation('admin.facility_create_map_cache');
  return toFacilityDto(facility);
};

export const updateAdminFacilityRecord = async (input: {
  actorId: string;
  facilityId: string;
  body: Partial<AdminFacilityWriteInput>;
}) => {
  const { facilityId, body } = input;
  const existing = await findFacilityById(facilityId);
  if (!existing) {
    throw new ApiError(404, 'facility_not_found', 'Facility not found.');
  }

  const facilityKind = body.facilityKind ?? existing.facilityKind;
  const areaLabel =
    body.areaLabel !== undefined ? body.areaLabel?.trim() || null : existing.areaLabel;
  const tags =
    body.facilityKind || body.tags
      ? mergeVenueAreaTag(
          [
            ...tagsForPlaceKind(facilityKind),
            ...(body.tags ?? existing.tags ?? []).filter((t) => !t.startsWith('place-kind:')),
          ],
          areaLabel
        )
      : undefined;

  const refreshed = await updateAdminFacility(facilityId, {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.region !== undefined ? { region: body.region } : {}),
    ...(areaLabel !== undefined ? { areaLabel } : {}),
    ...(body.areaId !== undefined ? { areaId: body.areaId.trim() } : {}),
    ...(body.facilityKind !== undefined ? { facilityKind: body.facilityKind } : {}),
    ...(body.parentPlaceId !== undefined
      ? { parentPlaceId: body.parentPlaceId?.trim() || null }
      : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
    ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
    ...(body.images !== undefined ? { images: body.images } : {}),
    ...(body.featured !== undefined ? { featured: body.featured } : {}),
    ...(body.status !== undefined ? { status: toPrismaLocationStatus(body.status) } : {}),
    ...(tags ? { tags } : {}),
    ...(body.countryCode !== undefined ? { countryCode: body.countryCode.toUpperCase() } : {}),
    ...(body.partnerReferralUrl !== undefined
      ? { partnerReferralUrl: body.partnerReferralUrl?.trim() || null }
      : {}),
  });

  if (!refreshed) {
    throw new ApiError(404, 'facility_not_found', 'Facility not found.');
  }

  await createAuditLog({
    actorId: input.actorId,
    action: 'facility.update',
    entityType: 'facility',
    entityId: facilityId,
  });
  scheduleExploreMapCacheInvalidation('admin.facility_update_map_cache');
  return toFacilityDto(refreshed);
};

export const deleteAdminFacilityRecord = async (input: { actorId: string; facilityId: string }) => {
  const existing = await findFacilityById(input.facilityId);
  if (!existing) {
    throw new ApiError(404, 'facility_not_found', 'Facility not found.');
  }
  await deleteAdminFacility(input.facilityId);
  await createAuditLog({
    actorId: input.actorId,
    action: 'facility.delete',
    entityType: 'facility',
    entityId: input.facilityId,
  });
  scheduleExploreMapCacheInvalidation('admin.facility_delete_map_cache');
};

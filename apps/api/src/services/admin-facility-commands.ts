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
import { catalogDestinationIdUpdate } from '@uaetrail/shared-types';
import { catalogOnSiteIdUpdate } from '../lib/facility-on-site-sync.js';
import { assertActiveListedFacilityHasCatalogGeo } from '../lib/listed-catalog-geo-gate.js';

export type AdminFacilityWriteInput = {
  name: string;
  region: string;
  placeHubLabel?: string | null;
  destinationId: string;
  facilityKind: FacilityKind;
  onSiteId?: string | null;
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
  const placeHubLabel = body.placeHubLabel?.trim() || null;
  const tags = mergeVenueAreaTag(
    [...tagsForPlaceKind(body.facilityKind), ...(body.tags ?? [])],
    placeHubLabel
  );

  const facility = await createAdminFacility({
    name: body.name,
    region: body.region,
    placeHubLabel,
    destinationId: body.destinationId.trim(),
    facilityKind: body.facilityKind,
    onSiteId: body.onSiteId?.trim() || null,
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
  if (facility.status === LocationStatus.ACTIVE && facility.registryListed !== false) {
    assertActiveListedFacilityHasCatalogGeo(facility);
  }
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

  const nextStatus =
    body.status !== undefined ? toPrismaLocationStatus(body.status) : existing.status;
  const activating =
    nextStatus === LocationStatus.ACTIVE && existing.status !== LocationStatus.ACTIVE;

  const facilityKind = body.facilityKind ?? existing.facilityKind;
  const placeHubLabel =
    body.placeHubLabel !== undefined ? body.placeHubLabel?.trim() || null : existing.placeHubLabel;
  const tags =
    body.facilityKind || body.tags
      ? mergeVenueAreaTag(
          [
            ...tagsForPlaceKind(facilityKind),
            ...(body.tags ?? existing.tags ?? []).filter((t) => !t.startsWith('place-kind:')),
          ],
          placeHubLabel
        )
      : undefined;

  const refreshed = await updateAdminFacility(facilityId, {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.region !== undefined ? { region: body.region } : {}),
    ...(placeHubLabel !== undefined ? { placeHubLabel } : {}),
    ...(body.destinationId !== undefined ? { destinationId: body.destinationId.trim() } : {}),
    ...(body.facilityKind !== undefined ? { facilityKind: body.facilityKind } : {}),
    ...(body.onSiteId !== undefined ? { onSiteId: body.onSiteId?.trim() || null } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
    ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
    ...(body.images !== undefined ? { images: body.images } : {}),
    ...(body.featured !== undefined ? { featured: body.featured } : {}),
    ...(body.status !== undefined ? { status: nextStatus } : {}),
    ...(tags ? { tags } : {}),
    ...(body.countryCode !== undefined ? { countryCode: body.countryCode.toUpperCase() } : {}),
    ...(body.partnerReferralUrl !== undefined
      ? { partnerReferralUrl: body.partnerReferralUrl?.trim() || null }
      : {}),
  });

  if (!refreshed) {
    throw new ApiError(404, 'facility_not_found', 'Facility not found.');
  }

  if (activating) {
    assertActiveListedFacilityHasCatalogGeo(refreshed);
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

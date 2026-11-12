import {
  RIDESHARE_DESTINATION_PLACE_PREFIX,
  RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX,
  rideshareDestinationPlaceId,
} from '@uaetrail/shared-types';
import { ActivityType } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { createAuditLog } from '../lib/audit.js';
import {
  findLocationById,
  updateActivityDetailed,
} from '../lib/activities-store.js';
import { findAdminEventById } from '../lib/admin-store.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import { buildActivityDto } from '../lib/mappers.js';
import { findPublishedActivityWithPreviewsFromMongo } from '../lib/activity-read-assembler.js';

const stripDestinationPlaceLines = (requirements: string[] | null | undefined): string[] =>
  (requirements ?? []).filter(
    (line) =>
      !line.startsWith(RIDESHARE_DESTINATION_PLACE_PREFIX) &&
      !line.startsWith(RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX)
  );

/** Platform admin — link / clear rideshare → parent outing. */
export const adminSetRideshareParentLink = async (input: {
  actorId: string;
  rideshareActivityId: string;
  parentActivityId: string | null;
}) => {
  const rideshare = await findAdminEventById(input.rideshareActivityId);
  if (!rideshare) {
    throw new ApiError(404, 'activity_not_found', 'Rideshare activity not found.');
  }
  if (rideshare.activityType !== ActivityType.RIDESHARE) {
    throw new ApiError(400, 'not_rideshare', 'Only rideshare activities can be linked as rides.');
  }

  const previousParentId = rideshare.linkedActivityId ?? null;

  if (input.parentActivityId) {
    if (input.parentActivityId === rideshare.id) {
      throw new ApiError(400, 'self_link', 'Cannot link a ride to itself.');
    }
    const parent = await findAdminEventById(input.parentActivityId);
    if (!parent) {
      throw new ApiError(404, 'parent_not_found', 'Parent activity not found.');
    }
    if (parent.activityType === ActivityType.RIDESHARE) {
      throw new ApiError(400, 'invalid_parent', 'Cannot link a ride to another rideshare.');
    }

    await updateActivityDetailed(rideshare.id, { linkedActivityId: parent.id });
    await updateActivityDetailed(parent.id, { linkedRideshareActivityId: rideshare.id });

    if (previousParentId && previousParentId !== parent.id) {
      const previous = await findActivityDocInMongo(previousParentId);
      if (previous?.linkedRideshareActivityId === rideshare.id) {
        await updateActivityDetailed(previousParentId, { linkedRideshareActivityId: null });
      }
    }
  } else {
    await updateActivityDetailed(rideshare.id, { linkedActivityId: null });
    if (previousParentId) {
      const previous = await findActivityDocInMongo(previousParentId);
      if (previous?.linkedRideshareActivityId === rideshare.id) {
        await updateActivityDetailed(previousParentId, { linkedRideshareActivityId: null });
      }
    }
  }

  await createAuditLog({
    actorId: input.actorId,
    action: input.parentActivityId ? 'activity.rideshare_link_parent' : 'activity.rideshare_unlink_parent',
    entityType: 'activity',
    entityId: rideshare.id,
    tenantId: rideshare.tenantId,
    metadata: {
      parentActivityId: input.parentActivityId,
      previousParentId,
    },
  });

  const updated = await findPublishedActivityWithPreviewsFromMongo(rideshare.id);
  return {
    message: input.parentActivityId ? 'Ride linked to outing.' : 'Ride unlinked from outing.',
    data: updated ? buildActivityDto(updated) : null,
  };
};

/** Platform admin — link / clear rideshare destination catalog place. */
export const adminSetRideshareDestinationPlace = async (input: {
  actorId: string;
  rideshareActivityId: string;
  placeId: string | null;
}) => {
  const rideshare = await findAdminEventById(input.rideshareActivityId);
  if (!rideshare) {
    throw new ApiError(404, 'activity_not_found', 'Rideshare activity not found.');
  }
  if (rideshare.activityType !== ActivityType.RIDESHARE) {
    throw new ApiError(400, 'not_rideshare', 'Only rideshare activities can target a place.');
  }

  const doc = await findActivityDocInMongo(rideshare.id);
  if (!doc) {
    throw new ApiError(404, 'activity_not_found', 'Rideshare activity not found.');
  }

  const previousPlaceId = rideshareDestinationPlaceId(doc.requirements);
  let nextRequirements = stripDestinationPlaceLines(doc.requirements);

  if (input.placeId) {
    const place = await findLocationById(input.placeId);
    if (!place) {
      throw new ApiError(404, 'location_not_found', 'Place not found.');
    }
    nextRequirements = [
      ...nextRequirements,
      `${RIDESHARE_DESTINATION_PLACE_PREFIX}${input.placeId}`,
    ];
  }

  await updateActivityDetailed(rideshare.id, { requirements: nextRequirements });

  await createAuditLog({
    actorId: input.actorId,
    action: input.placeId
      ? 'activity.rideshare_link_place'
      : 'activity.rideshare_unlink_place',
    entityType: 'activity',
    entityId: rideshare.id,
    tenantId: rideshare.tenantId,
    metadata: { placeId: input.placeId, previousPlaceId },
  });

  const updated = await findPublishedActivityWithPreviewsFromMongo(rideshare.id);
  return {
    message: input.placeId ? 'Ride linked to place.' : 'Ride unlinked from place.',
    data: updated ? buildActivityDto(updated) : null,
  };
};

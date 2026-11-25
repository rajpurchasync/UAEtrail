import {
  RIDESHARE_DESTINATION_ACTIVITY_PREFIX,
  RIDESHARE_DESTINATION_PLACE_PREFIX,
  RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX,
  rideshareDestinationActivityId,
  rideshareDestinationPlaceId,
  rideshareHasPendingDestinationPlace,
} from '@uaetrail/shared-types';
import type { HostTierFlags } from '@uaetrail/shared-types';
import { ActivityStatus, ActivityType, LocationStatus } from '../domain/enums.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { findLocationInMongo } from './entity-sync.js';
import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';

const activitiesCol = (): Collection<MongoActivityDoc> =>
  getMongoClient()!.db().collection<MongoActivityDoc>('activities');

export const hostHasProRideshareDestinationAccess = (hostTiers: HostTierFlags): boolean =>
  Boolean(hostTiers.professional || hostTiers.business);

export const rideshareDestinationRequirementLines = (input: {
  kind: 'map' | 'activity_meeting' | 'catalog_place' | 'pending_place';
  activityId?: string | null;
  placeId?: string | null;
}): string[] => {
  if (input.kind === 'activity_meeting' && input.activityId?.trim()) {
    return [`${RIDESHARE_DESTINATION_ACTIVITY_PREFIX}${input.activityId.trim()}`];
  }
  if (input.kind === 'catalog_place' && input.placeId?.trim()) {
    return [`${RIDESHARE_DESTINATION_PLACE_PREFIX}${input.placeId.trim()}`];
  }
  if (input.kind === 'pending_place' && input.placeId?.trim()) {
    return [`${RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX}${input.placeId.trim()}`];
  }
  return [];
};

export const assertCommunityRideshareCanPublish = async (
  event: Pick<
    MongoActivityDoc,
    'activityType' | 'requirements' | 'startLat' | 'startLng' | 'linkedActivityId'
  >,
  hostTiers: HostTierFlags
): Promise<void> => {
  if (String(event.activityType).toUpperCase() !== ActivityType.RIDESHARE) return;
  if (hostHasProRideshareDestinationAccess(hostTiers)) return;

  if (rideshareHasPendingDestinationPlace(event.requirements ?? [])) {
    const placeId = rideshareDestinationPlaceId(event.requirements ?? []);
    if (!placeId) {
      throw new Error('Rideshare destination place is missing.');
    }
    const place = await findLocationInMongo(placeId);
    if (!place || place.status !== LocationStatus.ACTIVE || !place.destinationId?.trim()) {
      throw new Error(
        'This ride stays in review until your destination place is approved on the map.'
      );
    }
    return;
  }

  const activityId = rideshareDestinationActivityId(event.requirements ?? []);
  if (activityId) {
    const parent = await activitiesCol().findOne({
      _id: activityId,
      status: ActivityStatus.PUBLISHED,
      activityType: { $ne: ActivityType.RIDESHARE },
    });
    if (!parent) {
      throw new Error('Linked outing meeting point is no longer available.');
    }
    const lat = parent.meetingLat;
    const lng = parent.meetingLng;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Linked outing has no meeting point.');
    }
    if (
      event.startLat == null ||
      event.startLng == null ||
      Math.abs(event.startLat - lat) > 0.002 ||
      Math.abs(event.startLng - lng) > 0.002
    ) {
      throw new Error('Destination must match the outing meeting point you selected.');
    }
    return;
  }

  const placeId = rideshareDestinationPlaceId(event.requirements ?? []);
  if (placeId) {
    const place = await findLocationInMongo(placeId);
    if (!place || place.status !== LocationStatus.ACTIVE || !place.destinationId?.trim()) {
      throw new Error('Choose an approved catalog place as the ride destination.');
    }
    if (
      event.startLat == null ||
      event.startLng == null ||
      place.latitude == null ||
      place.longitude == null ||
      Math.abs(event.startLat - place.latitude) > 0.002 ||
      Math.abs(event.startLng - place.longitude) > 0.002
    ) {
      throw new Error('Destination must match the catalog place you selected.');
    }
    return;
  }

  throw new Error(
    'Community hosts must set the ride destination to an outing meeting point or an approved place. Pro members can pin any destination on the map.'
  );
};

export const publishDraftRidesharesPendingDestinationPlace = async (placeId: string): Promise<string[]> => {
  const prefix = `${RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX}${placeId}`;
  const drafts = await activitiesCol()
    .find({
      status: ActivityStatus.DRAFT,
      activityType: ActivityType.RIDESHARE,
      requirements: prefix,
    })
    .toArray();

  const publishedIds: string[] = [];
  const { publishActivityById } = await import('./activities-store.js');
  for (const draft of drafts) {
    try {
      await publishActivityById(String(draft._id));
      publishedIds.push(String(draft._id));
    } catch {
      // leave draft for manual review
    }
  }
  return publishedIds;
};

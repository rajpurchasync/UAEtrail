import { PENDING_VENUE_PLACE_PREFIX } from '@uaetrail/shared-types';
import { ActivityStatus } from '../domain/enums.js';
import type { MongoActivityDoc } from './entity-builders.js';
import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';
import { patchActivityInMongo } from './entity-sync.js';

const activitiesCol = (): Collection<MongoActivityDoc> =>
  getMongoClient()!.db().collection<MongoActivityDoc>('activities');

export type PendingVenuePublishHit = {
  activityId: string;
  tenantId: string;
  hostUserId: string;
  title: string;
  notifyUserIds: string[];
};

export const publishDraftActivitiesPendingVenuePlace = async (
  placeId: string
): Promise<PendingVenuePublishHit[]> => {
  const prefix = `${PENDING_VENUE_PLACE_PREFIX}${placeId}`;
  const drafts = await activitiesCol()
    .find({
      status: ActivityStatus.DRAFT,
      locationId: placeId,
      requirements: prefix,
    })
    .toArray();

  const published: PendingVenuePublishHit[] = [];
  const { publishActivityById } = await import('./activities-store.js');
  for (const draft of drafts) {
    try {
      await publishActivityById(String(draft._id));
      const cleaned = (draft.requirements ?? []).filter(
        (row) => !row.startsWith(PENDING_VENUE_PLACE_PREFIX)
      );
      await patchActivityInMongo(String(draft._id), { requirements: cleaned });
      const guideIds = (draft.guides ?? [])
        .map((guide) => guide.userId)
        .filter((id): id is string => Boolean(id));
      published.push({
        activityId: String(draft._id),
        tenantId: draft.tenantId,
        hostUserId: draft.hostId ?? draft.createdById,
        title: draft.title,
        notifyUserIds: guideIds,
      });
    } catch {
      // leave draft for manual review
    }
  }
  return published;
};

import type { ActivityDTO } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { listPublishedLinkedRidesByParentFromMongo } from '../lib/activity-read-assembler.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import { buildActivityDto } from '../lib/mappers.js';
import { ActivityStatus, ActivityType } from '../domain/enums.js';

export type ActivityLinkedRidesResponse = {
  data: ActivityDTO[];
  meta: { total: number };
};

/** Public list of published rideshare offers linked to a parent outing. */
export const listPublicActivityLinkedRides = async (
  parentActivityId: string
): Promise<ActivityLinkedRidesResponse> => {
  // Lean existence check — avoid full preview assemble for the parent.
  const parent = await findActivityDocInMongo(parentActivityId);
  if (!parent || parent.status !== ActivityStatus.PUBLISHED) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  if (parent.activityType === ActivityType.RIDESHARE) {
    return { data: [], meta: { total: 0 } };
  }

  const assembled = await listPublishedLinkedRidesByParentFromMongo(parentActivityId);
  const data = assembled.map((event) => buildActivityDto(event));
  return { data, meta: { total: data.length } };
};

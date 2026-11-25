import type {
  ActivityDTO,
  DestinationPublicDTO,
  LocationDTO,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { COLLECTIONS } from '../lib/collections.js';
import { getMongoClient } from '../lib/mongo.js';
import { ActivityStatus, LocationStatus } from '../domain/enums.js';
import { mongoExcludeRetiredSeekingActivityMode } from '../domain/retired-seeking-activity-mode.js';
import {
  findDestinationBySlug,
  listPublishedDestinations,
  toDestinationPublicDto,
} from '../lib/destinations-store.js';
import {
  listActiveCatalogPlacesByDestination,
  listPublishedUpcomingActivitiesByDestination,
} from '../lib/activities-store.js';
import { buildActivityDto, toLocationDto } from '../lib/mappers.js';
import { listProHostStorefrontsForDestinationPreview } from '../lib/destination-pro-host-preview.js';

const DESTINATION_PREVIEW_ACTIVITY_LIMIT = 8;
const DESTINATION_PREVIEW_PLACE_LIMIT = 40;
const DESTINATION_PREVIEW_OPERATOR_LIMIT = 8;

export type PublishedDestinationPreviewCounts = {
  activities: number;
  places: number;
  /** Public `member_availability` rows scoped to this hub. */
  availability: number;
};

export const countPublishedDestinationPreviewByDestinationId = async (
  destinationId: string
): Promise<PublishedDestinationPreviewCounts> => {
  const db = getMongoClient()!.db();
  const [activities, places, availability] = await Promise.all([
    db.collection(COLLECTIONS.ACTIVITIES).countDocuments({
      destinationId,
      status: ActivityStatus.PUBLISHED,
      ...mongoExcludeRetiredSeekingActivityMode,
    }),
    db.collection(COLLECTIONS.LOCATIONS).countDocuments({
      destinationId,
      status: LocationStatus.ACTIVE,
    }),
    db.collection(COLLECTIONS.MEMBER_AVAILABILITY).countDocuments({
      destinationId,
      visibility: 'public',
    }),
  ]);
  return { activities, places, availability };
};

export const listPublishedDestinationsForPublic = async (): Promise<DestinationPublicDTO[]> => {
  const destinations = await listPublishedDestinations();
  return destinations.map((row) => toDestinationPublicDto(row));
};

export type PublishedDestinationDetailPayload = {
  destination: DestinationPublicDTO;
  counts: PublishedDestinationPreviewCounts;
  preview: {
    activities: ActivityDTO[];
    places: LocationDTO[];
    operators: Awaited<ReturnType<typeof listProHostStorefrontsForDestinationPreview>>;
  };
};

/** Public destination hub (`GET /destinations/:slug`). */
export const loadPublishedDestinationDetailBySlug = async (
  slug: string
): Promise<PublishedDestinationDetailPayload> => {
  const row = await findDestinationBySlug(slug);
  if (!row || row.status !== 'published') {
    throw new ApiError(404, 'destination_not_found', 'Destination not found.');
  }
  const counts = await countPublishedDestinationPreviewByDestinationId(row.id);
  const [activityRows, placeRows, operators] = await Promise.all([
    listPublishedUpcomingActivitiesByDestination(row.id, DESTINATION_PREVIEW_ACTIVITY_LIMIT),
    listActiveCatalogPlacesByDestination(row.id, DESTINATION_PREVIEW_PLACE_LIMIT),
    listProHostStorefrontsForDestinationPreview(row.id, DESTINATION_PREVIEW_OPERATOR_LIMIT),
  ]);
  return {
    destination: toDestinationPublicDto(row),
    counts,
    preview: {
      activities: activityRows.map((event) => buildActivityDto(event)),
      places: placeRows.map((place) => toLocationDto(place)),
      operators,
    },
  };
};

export type { ActivityDTO, LocationDTO };
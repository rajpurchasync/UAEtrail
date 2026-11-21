import type { ActivityDTO, AreaPublicDTO, LocationDTO } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { COLLECTIONS } from '../lib/collections.js';
import { getMongoClient } from '../lib/mongo.js';
import { ActivityStatus, LocationStatus } from '../domain/enums.js';
import {
  findAreaBySlug,
  listPublishedAreas,
  toAreaPublicDto,
} from '../lib/areas-store.js';
import {
  listActiveCatalogPlacesByArea,
  listPublishedUpcomingActivitiesByArea,
} from '../lib/activities-store.js';
import { buildActivityDto, toLocationDto } from '../lib/mappers.js';
import { listProHostStorefrontsForAreaPreview } from '../lib/area-pro-host-preview.js';

const AREA_PREVIEW_ACTIVITY_LIMIT = 8;
const AREA_PREVIEW_PLACE_LIMIT = 40;
const AREA_PREVIEW_OPERATOR_LIMIT = 8;

export type PublishedAreaPreviewCounts = {
  activities: number;
  places: number;
  /** Public `member_availability` rows scoped to this hub. */
  availability: number;
};

/** Read model for public area card aggregates (`GET /areas/:slug`). */
export const countPublishedAreaPreviewByAreaId = async (
  areaId: string
): Promise<PublishedAreaPreviewCounts> => {
  const db = getMongoClient()!.db();
  const [activities, places, availability] = await Promise.all([
    db.collection(COLLECTIONS.ACTIVITIES).countDocuments({
      areaId,
      status: ActivityStatus.PUBLISHED,
      activityMode: { $ne: 'seeking' },
    }),
    db.collection(COLLECTIONS.LOCATIONS).countDocuments({
      areaId,
      status: LocationStatus.ACTIVE,
    }),
    db.collection(COLLECTIONS.MEMBER_AVAILABILITY).countDocuments({
      areaId,
      visibility: 'public',
    }),
  ]);
  return { activities, places, availability };
};

export const listPublishedAreasForPublic = async (): Promise<AreaPublicDTO[]> => {
  const areas = await listPublishedAreas();
  return areas.map(toAreaPublicDto);
};

export type PublishedAreaDetailPayload = {
  area: AreaPublicDTO;
  counts: PublishedAreaPreviewCounts;
  preview: {
    activities: ActivityDTO[];
    places: LocationDTO[];
    operators: Awaited<ReturnType<typeof listProHostStorefrontsForAreaPreview>>;
  };
};

/** Public area hub (`GET /areas/:slug`). */
export const loadPublishedAreaDetailBySlug = async (
  slug: string
): Promise<PublishedAreaDetailPayload> => {
  const area = await findAreaBySlug(slug);
  if (!area || area.status !== 'published') {
    throw new ApiError(404, 'area_not_found', 'Area not found.');
  }
  const counts = await countPublishedAreaPreviewByAreaId(area.id);
  const [activityRows, placeRows, operators] = await Promise.all([
    listPublishedUpcomingActivitiesByArea(area.id, AREA_PREVIEW_ACTIVITY_LIMIT),
    listActiveCatalogPlacesByArea(area.id, AREA_PREVIEW_PLACE_LIMIT),
    listProHostStorefrontsForAreaPreview(area.id, AREA_PREVIEW_OPERATOR_LIMIT),
  ]);
  return {
    area: toAreaPublicDto(area),
    counts,
    preview: {
      activities: activityRows.map((event) => buildActivityDto(event)),
      places: placeRows.map((place) => toLocationDto(place)),
      operators,
    },
  };
};

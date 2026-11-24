import type {
  ActivityDTO,
  DestinationPublicDTO,
  LocationDTO,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import {
  countPublishedAreaPreviewByAreaId,
  listPublishedAreasForPublic,
  loadPublishedAreaDetailBySlug,
  type PublishedAreaDetailPayload,
  type PublishedAreaPreviewCounts,
} from './area-public-read.js';
import { toDestinationPublicDto } from '../lib/destinations-store.js';

export type PublishedDestinationPreviewCounts = PublishedAreaPreviewCounts;

export type PublishedDestinationDetailPayload = {
  destination: DestinationPublicDTO;
  counts: PublishedDestinationPreviewCounts;
  preview: PublishedAreaDetailPayload['preview'];
};

export const listPublishedDestinationsForPublic = async (): Promise<DestinationPublicDTO[]> => {
  const rows = await listPublishedAreasForPublic();
  return rows.map((row) => toDestinationPublicDto(row));
};

/** Public destination hub (`GET /destinations/:slug`). */
export const loadPublishedDestinationDetailBySlug = async (
  slug: string
): Promise<PublishedDestinationDetailPayload> => {
  try {
    const payload = await loadPublishedAreaDetailBySlug(slug);
    return {
      destination: toDestinationPublicDto(payload.area),
      counts: payload.counts,
      preview: payload.preview,
    };
  } catch (error) {
    if (error instanceof ApiError && error.code === 'area_not_found') {
      throw new ApiError(404, 'destination_not_found', 'Destination not found.');
    }
    throw error;
  }
};

export const countPublishedDestinationPreviewByDestinationId = countPublishedAreaPreviewByAreaId;

export type { ActivityDTO, LocationDTO };
import type { DestinationPublicDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { DestinationDetailPayload } from '../api/domains/destinations';

export type { DestinationDetailPayload };

/** Published destination list (`GET /destinations`). */
export const fetchPublishedDestinations = async (): Promise<DestinationPublicDTO[]> => {
  const res = await api.listPublishedDestinations();
  return res.data;
};

/** Destination hub detail (`GET /destinations/:slug`). */
export const fetchDestinationDetailBySlug = async (
  slug: string
): Promise<DestinationDetailPayload> => {
  const res = await api.getDestinationBySlug(slug);
  return res.data;
};
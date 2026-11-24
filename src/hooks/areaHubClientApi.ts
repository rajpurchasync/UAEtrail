import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { AreaDetailPayload } from '../api/domains/areas';

export type { AreaDetailPayload };

/** Published destination list (canonical `GET /destinations`). */
export const fetchPublishedDestinations = async (): Promise<AreaPublicDTO[]> => {
  const res = await api.listPublishedDestinations();
  return res.data;
};

/** Destination hub detail (canonical `GET /destinations/:slug`). */
export const fetchDestinationDetailBySlug = async (slug: string): Promise<AreaDetailPayload> => {
  const res = await api.getDestinationBySlug(slug);
  return res.data;
};
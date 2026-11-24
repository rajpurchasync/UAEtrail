import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { AreaDetailPayload } from '../api/domains/areas';

export type { AreaDetailPayload };

const toAreaDetailPayload = (data: {
  destination: AreaPublicDTO;
  counts: AreaDetailPayload['counts'];
  preview: AreaDetailPayload['preview'];
}): AreaDetailPayload => ({
  area: data.destination,
  counts: data.counts,
  preview: data.preview,
});

/** Published destination list (canonical `GET /destinations`). */
export const fetchPublishedAreas = async (): Promise<AreaPublicDTO[]> => {
  const res = await api.listPublishedDestinations();
  return res.data;
};

/** Destination hub detail (canonical `GET /destinations/:slug`). */
export const fetchAreaDetailBySlug = async (slug: string): Promise<AreaDetailPayload> => {
  const res = await api.getDestinationBySlug(slug);
  return toAreaDetailPayload(res.data);
};
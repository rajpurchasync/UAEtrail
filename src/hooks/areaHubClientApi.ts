import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { AreaDetailPayload } from '../api/domains/areas';

export type { AreaDetailPayload };

export const fetchPublishedAreas = async (): Promise<AreaPublicDTO[]> => {
  const res = await api.listPublishedAreas();
  return res.data;
};

export const fetchAreaDetailBySlug = async (slug: string): Promise<AreaDetailPayload> => {
  const res = await api.getAreaBySlug(slug);
  return res.data;
};

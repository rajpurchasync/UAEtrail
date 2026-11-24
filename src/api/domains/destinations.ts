import { apiRequest } from '../client';
import type {
  ActivityDTO,
  DestinationPublicDTO,
  LocationDTO,
} from '@uaetrail/shared-types';
import type { AreaDetailPayload } from './areas';

export type DestinationDetailPayload = {
  destination: DestinationPublicDTO;
  counts: AreaDetailPayload['counts'];
  preview: AreaDetailPayload['preview'];
};

export const destinationsApi = {
  listPublishedDestinations: () =>
    apiRequest<{ data: DestinationPublicDTO[] }>('/destinations'),
  getDestinationBySlug: (slug: string) =>
    apiRequest<{ data: DestinationDetailPayload }>(
      `/destinations/${encodeURIComponent(slug)}`
    ),
};

export type { ActivityDTO, LocationDTO };
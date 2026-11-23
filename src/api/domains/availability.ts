import type {
  ExploreAvailabilityClusterDTO,
  ExploreAvailablePersonDTO,
  MemberAvailabilityDTO,
  MemberAvailabilityMatchPreviewDTO,
  UpsertMemberAvailabilityInput,
} from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export type ExploreAvailabilityIndex = {
  people: ExploreAvailablePersonDTO[];
  clusters: ExploreAvailabilityClusterDTO[];
};

export const availabilityApi = {
  getMyAvailability: () =>
    apiRequest<{ data: MemberAvailabilityDTO }>('/me/availability', { auth: true }),
  putMyAvailability: (body: UpsertMemberAvailabilityInput) =>
    apiRequest<{ data: MemberAvailabilityDTO }>('/me/availability', {
      method: 'PUT',
      body: JSON.stringify(body),
      auth: true,
    }),
  getMyAvailabilityMatchPreview: () =>
    apiRequest<{ data: MemberAvailabilityMatchPreviewDTO }>('/me/availability/match-preview', {
      auth: true,
    }),
  explorePeopleAvailability: (params: {
    from: string;
    to: string;
    kind?: string;
    area?: string;
    friendsOnly?: boolean;
  }) => {
    const search = new URLSearchParams({ from: params.from, to: params.to });
    if (params.kind) search.set('kind', params.kind);
    if (params.area) search.set('area', params.area);
    if (params.friendsOnly) search.set('friendsOnly', '1');
    return apiRequest<{ data: ExploreAvailabilityIndex }>(
      `/explore/people/availability?${search.toString()}`,
      { auth: true }
    );
  },
} as const;

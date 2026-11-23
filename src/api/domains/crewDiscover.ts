import type { CrewDiscoverFeedDTO, MemberDiscoveryQuotaDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export type DiscoverCrewFeedResponse = {
  data: CrewDiscoverFeedDTO;
  meta: {
    page: number;
    pageSize: number;
    quota: MemberDiscoveryQuotaDTO;
  };
};

export const crewDiscoverApi = {
  getDiscoverCrewFeed: (options?: {
    page?: number;
    pageSize?: number;
    q?: string;
    date?: string | null;
    omitDirectory?: boolean;
  }) => {
    const params = new URLSearchParams({
      page: String(options?.page ?? 1),
      pageSize: String(options?.pageSize ?? 30),
    });
    if (options?.q?.trim()) params.set('q', options.q.trim());
    if (options?.date) params.set('date', options.date);
    if (options?.omitDirectory) params.set('omitDirectory', '1');
    return apiRequest<DiscoverCrewFeedResponse>(`/discover/crew?${params.toString()}`, { auth: true });
  },
} as const;
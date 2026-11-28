import { useQuery } from '@tanstack/react-query';
import type { PlaceDTO } from '@uaetrail/shared-types';
import type { TeamMember } from '../api/types';
import {
  fetchPublishingSubmittedPlaces,
  fetchPublishingTeam,
  fetchTenantStorefrontReviews,
} from './operatorDeskClientApi';
import { fetchMyTenantMemberships } from './tenantMembershipApi';
import {
  myTenantMembershipsQueryKey,
  operatorDeskRatingQueryKey,
  publishingSubmittedPlacesQueryKey,
  publishingTeamQueryKey,
} from './clientQueryKeys';

export type OperatorDeskRating = {
  avgRating: number | null;
  reviewCount: number;
};

export const usePublishingSubmittedPlaces = (tenantId: string | null | undefined) =>
  useQuery({
    queryKey: tenantId ? publishingSubmittedPlacesQueryKey(tenantId) : ['publishing', 'submitted-places', ''],
    queryFn: async (): Promise<PlaceDTO[]> => fetchPublishingSubmittedPlaces(tenantId!),
    enabled: Boolean(tenantId),
  });

export const usePublishingTeam = (tenantId: string | null | undefined) =>
  useQuery({
    queryKey: tenantId ? publishingTeamQueryKey(tenantId) : ['publishing', 'team', ''],
    queryFn: async (): Promise<TeamMember[]> => fetchPublishingTeam(tenantId!),
    enabled: Boolean(tenantId),
  });

export const useMyTenantMemberships = () =>
  useQuery({
    queryKey: myTenantMembershipsQueryKey,
    queryFn: async () => fetchMyTenantMemberships(),
  });

/** Header rating chip on operator desk shell (best-effort). */
export const useOperatorDeskRating = (tenantId: string | null | undefined) =>
  useQuery({
    queryKey: tenantId ? operatorDeskRatingQueryKey(tenantId) : ['publishing', 'console-rating', ''],
    queryFn: async (): Promise<OperatorDeskRating> => {
      const reviews = await fetchTenantStorefrontReviews(tenantId!);
      if (reviews.length === 0) {
        return { avgRating: null, reviewCount: 0 };
      }
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      return { avgRating, reviewCount: reviews.length };
    },
    enabled: Boolean(tenantId),
    retry: false,
  });
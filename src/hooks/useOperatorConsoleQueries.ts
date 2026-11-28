import { useQuery } from '@tanstack/react-query';
import type { PlaceDTO } from '@uaetrail/shared-types';
import type { TeamMember } from '../api/types';
import {
  fetchWorkspaceSubmittedPlaces,
  fetchWorkspaceTeam,
  fetchTenantStorefrontReviews,
} from './operatorDeskClientApi';
import { fetchMyTenantMemberships } from './tenantMembershipApi';
import {
  myTenantMembershipsQueryKey,
  operatorDeskRatingQueryKey,
  workspaceSubmittedPlacesQueryKey,
  workspaceTeamQueryKey,
} from './clientQueryKeys';

export type OperatorDeskRating = {
  avgRating: number | null;
  reviewCount: number;
};

export const useWorkspaceSubmittedPlaces = (tenantId: string | null | undefined) =>
  useQuery({
    queryKey: tenantId
      ? workspaceSubmittedPlacesQueryKey(tenantId)
      : (['operator-workspace', 'submitted-places', ''] as const),
    queryFn: async (): Promise<PlaceDTO[]> => fetchWorkspaceSubmittedPlaces(tenantId!),
    enabled: Boolean(tenantId),
  });

export const useWorkspaceTeam = (tenantId: string | null | undefined) =>
  useQuery({
    queryKey: tenantId ? workspaceTeamQueryKey(tenantId) : (['operator-workspace', 'team', ''] as const),
    queryFn: async (): Promise<TeamMember[]> => fetchWorkspaceTeam(tenantId!),
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
    queryKey: tenantId
      ? operatorDeskRatingQueryKey(tenantId)
      : (['operator-workspace', 'console-rating', ''] as const),
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
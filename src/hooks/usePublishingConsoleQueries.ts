import { useQuery } from '@tanstack/react-query';
import type { PlaceDTO } from '@uaetrail/shared-types';
import type { TeamMember } from '../api/types';
import {
  fetchOrganisationReviews,
  fetchOrganisationSubmittedPlaces,
  fetchOrganisationTeam,
} from './operatorDeskClientApi';
import { fetchMyTenantMemberships } from './tenantMembershipApi';
import {
  myTenantMembershipsQueryKey,
  organisationConsoleRatingQueryKey,
  organisationSubmittedPlacesQueryKey,
  organisationTeamQueryKey,
} from './clientQueryKeys';

export type OrganisationConsoleRating = {
  avgRating: number | null;
  reviewCount: number;
};

export const useOrganisationSubmittedPlaces = (tenantId: string | null | undefined) =>
  useQuery({
    queryKey: tenantId ? organisationSubmittedPlacesQueryKey(tenantId) : ['publishing', 'submitted-places', ''],
    queryFn: async (): Promise<PlaceDTO[]> => fetchOrganisationSubmittedPlaces(tenantId!),
    enabled: Boolean(tenantId),
  });

export const useOrganisationTeam = (tenantId: string | null | undefined) =>
  useQuery({
    queryKey: tenantId ? organisationTeamQueryKey(tenantId) : ['publishing', 'team', ''],
    queryFn: async (): Promise<TeamMember[]> => fetchOrganisationTeam(tenantId!),
    enabled: Boolean(tenantId),
  });

export const useMyTenantMemberships = () =>
  useQuery({
    queryKey: myTenantMembershipsQueryKey,
    queryFn: async () => fetchMyTenantMemberships(),
  });

/** Header rating chip on publishing console shell (best-effort). */
export const useOrganisationConsoleRating = (tenantId: string | null | undefined) =>
  useQuery({
    queryKey: tenantId ? organisationConsoleRatingQueryKey(tenantId) : ['publishing', 'console-rating', ''],
    queryFn: async (): Promise<OrganisationConsoleRating> => {
      const reviews = await fetchOrganisationReviews(tenantId!);
      if (reviews.length === 0) {
        return { avgRating: null, reviewCount: 0 };
      }
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      return { avgRating, reviewCount: reviews.length };
    },
    enabled: Boolean(tenantId),
    retry: false,
  });
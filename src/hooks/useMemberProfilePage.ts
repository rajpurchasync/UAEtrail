import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActivityDTO, BuddyRelationshipDTO } from '@uaetrail/shared-types';
import type { PersonPublicProfileDTO } from '../api/types';
import { fetchBuddyRelationship } from './memberPeopleClientApi';
import {
  fetchMeProfilePublicPreview,
  fetchPersonPublicProfile,
  fetchPersonUpcomingActivities,
} from './memberPublicProfileApi';
import {
  buddyRelationshipQueryKey,
  personPublicProfileQueryKey,
  personUpcomingActivitiesQueryKey,
} from './clientQueryKeys';

const isUpgradeRequiredError = (error: unknown): boolean =>
  Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'upgrade_required');

export const useMemberProfilePage = ({
  userId,
  viewerId,
  previewAsPublic,
  fromDiscover,
}: {
  userId: string | undefined;
  viewerId: string | undefined;
  previewAsPublic: boolean;
  fromDiscover: boolean;
}) => {
  const queryClient = useQueryClient();
  const usePreview = Boolean(previewAsPublic && viewerId && userId && viewerId === userId);
  const profileQueryKey =
    userId && usePreview
      ? personPublicProfileQueryKey(userId, 'me-preview')
      : userId
        ? personPublicProfileQueryKey(userId, { mode: 'person', discover: fromDiscover })
        : ['person-public-profile', '', 'person', 'direct'];

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => {
      if (!userId) throw new Error('Missing member id');
      if (usePreview) {
        return fetchMeProfilePublicPreview();
      }
      return fetchPersonPublicProfile(userId, { discover: fromDiscover });
    },
    enabled: Boolean(userId),
    retry: false,
    staleTime: 30_000,
  });

  const profile = profileQuery.data?.profile ?? null;
  const viewerAccess = profileQuery.data?.viewerAccess ?? null;
  const discoveryUpgradeRequired =
    fromDiscover && profileQuery.isError && isUpgradeRequiredError(profileQuery.error);

  const profileError =
    profileQuery.isError && !discoveryUpgradeRequired
      ? profileQuery.error instanceof Error
        ? profileQuery.error.message
        : 'We couldn\'t find this profile'
      : null;

  const upcomingQuery = useQuery({
    queryKey: userId ? personUpcomingActivitiesQueryKey(userId) : ['person-upcoming-activities', ''],
    queryFn: () => fetchPersonUpcomingActivities(userId!),
    enabled: Boolean(userId && viewerAccess?.canViewFullProfile),
    staleTime: 60_000,
  });

  const buddyQuery = useQuery({
    queryKey:
      viewerId && userId && viewerId !== userId
        ? buddyRelationshipQueryKey(viewerId, userId)
        : ['buddy-relationship', '', ''],
    queryFn: () => fetchBuddyRelationship(userId!),
    enabled: Boolean(viewerId && userId && viewerId !== userId),
    staleTime: 15_000,
  });

  const refreshProfile = async () => {
    if (!userId) return;
    await queryClient.invalidateQueries({ queryKey: profileQueryKey });
  };

  const setBuddyRel = (updater: (prev: BuddyRelationshipDTO | null) => BuddyRelationshipDTO | null) => {
    if (!viewerId || !userId || viewerId === userId) return;
    const key = buddyRelationshipQueryKey(viewerId, userId);
    queryClient.setQueryData<BuddyRelationshipDTO | null>(key, (prev) => updater(prev ?? null));
  };

  const reloadBuddy = () => buddyQuery.refetch();

  return {
    profile: profile as PersonPublicProfileDTO | null,
    viewerAccess,
    loading: profileQuery.isLoading,
    error: profileError,
    discoveryUpgradeRequired,
    upcomingActivities: (upcomingQuery.data ?? []) as ActivityDTO[],
    buddyRel: buddyQuery.data ?? null,
    setBuddyRel,
    reloadBuddy,
    refreshProfile,
  };
};

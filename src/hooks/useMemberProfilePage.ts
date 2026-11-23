import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActivityDTO, FriendRelationshipDTO } from '@uaetrail/shared-types';
import type { PersonPublicProfileDTO } from '../api/types';
import { fetchFriendRelationship } from './memberPeopleClientApi';
import {
  fetchMeProfilePublicPreview,
  fetchMemberProfileSocialGraph,
  fetchPersonPublicProfile,
  type MemberProfileProfileInclude,
} from './memberPublicProfileApi';
import { mergeMemberProfileSocialGraphParts } from './mergeMemberProfileSocialGraph';
import {
  friendRelationshipQueryKey,
  personPublicProfileQueryKey,
  personSocialGraphCommonQueryKey,
  personSocialGraphFriendsQueryKey,
  personSocialGraphQueryKey,
} from './clientQueryKeys';

const isUpgradeRequiredError = (error: unknown): boolean =>
  Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'upgrade_required');

const buildProfileIncludes = (input: {
  embedSocialGraph: boolean;
  embedActivities: boolean;
}): MemberProfileProfileInclude[] => {
  const includes: MemberProfileProfileInclude[] = [];
  if (input.embedSocialGraph) includes.push('socialGraph');
  if (input.embedActivities) includes.push('upcoming', 'past');
  return includes;
};

export const useMemberProfilePage = ({
  userId,
  viewerId,
  previewAsPublic,
  fromDiscover,
  loadSocialGraph = false,
  loadMemberActivities = false,
}: {
  userId: string | undefined;
  viewerId: string | undefined;
  previewAsPublic: boolean;
  fromDiscover: boolean;
  loadSocialGraph?: boolean;
  /** When false, upcoming/past lists load when the activity block nears the viewport. */
  loadMemberActivities?: boolean;
}) => {
  const queryClient = useQueryClient();
  const usePreview = Boolean(previewAsPublic && viewerId && userId && viewerId === userId);
  const embedSocialGraphInProfile = Boolean(
    loadSocialGraph && viewerId && userId && viewerId === userId
  );
  const embedActivitiesInProfile = Boolean(
    loadMemberActivities && viewerId && userId && viewerId === userId
  );
  const profileIncludes = buildProfileIncludes({
    embedSocialGraph: embedSocialGraphInProfile,
    embedActivities: embedActivitiesInProfile,
  });
  const bundleKey =
  profileIncludes.length > 0 ? profileIncludes.slice().sort().join('+') : 'base';

  const profileQueryKey =
    userId && usePreview
      ? personPublicProfileQueryKey(userId, 'me-preview')
      : userId
        ? personPublicProfileQueryKey(userId, {
            mode: 'person',
            discover: fromDiscover,
            bundleKey,
          })
        : ['person-public-profile', '', 'person', 'direct', 'base'];

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => {
      if (!userId) throw new Error('Missing member id');
      if (usePreview) {
        return fetchMeProfilePublicPreview();
      }
      return fetchPersonPublicProfile(userId, {
        discover: fromDiscover,
        include: profileIncludes.length > 0 ? profileIncludes : undefined,
        socialGraph: embedSocialGraphInProfile,
      });
    },
    enabled: Boolean(userId),
    retry: false,
    staleTime: 30_000,
  });

  const embeddedSocialGraph = profileQuery.data?.socialGraph ?? null;
  const embeddedUpcoming = profileQuery.data?.upcomingActivities ?? null;
  const embeddedPast = profileQuery.data?.pastActivities ?? null;
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

  const activitiesBundleQuery = useQuery({
    queryKey: personPublicProfileQueryKey(userId ?? '', {
      mode: 'person',
      discover: fromDiscover,
      bundleKey: 'upcoming+past',
    }),
    queryFn: () =>
      fetchPersonPublicProfile(userId!, {
        discover: fromDiscover,
        include: ['upcoming', 'past'],
      }),
    enabled: Boolean(
      userId &&
        viewerAccess?.canOpenMemberProfile &&
        loadMemberActivities &&
        !embedActivitiesInProfile
    ),
    staleTime: 60_000,
  });

  const stagedSocial = Boolean(
    loadSocialGraph && !embedSocialGraphInProfile && userId && viewerAccess?.canOpenMemberProfile
  );
  const loadCommonFollowsPart = stagedSocial && Boolean(viewerId && userId && viewerId !== userId);

  const socialFriendsQuery = useQuery({
    queryKey: userId ? personSocialGraphFriendsQueryKey(userId, viewerId) : ['person-social-graph', '', '', 'friends'],
    queryFn: () => fetchMemberProfileSocialGraph(userId!, { parts: ['friends'] }),
    enabled: stagedSocial,
    staleTime: 60_000,
  });

  const socialCommonQuery = useQuery({
    queryKey: userId ? personSocialGraphCommonQueryKey(userId, viewerId) : ['person-social-graph', '', '', 'common'],
    queryFn: () => fetchMemberProfileSocialGraph(userId!, { parts: ['commonFollows'] }),
    enabled: loadCommonFollowsPart,
    staleTime: 60_000,
  });

  const socialGraph = useMemo(
    () =>
      mergeMemberProfileSocialGraphParts({
        embedded: embeddedSocialGraph,
        friendsPart: socialFriendsQuery.data ?? null,
        commonPart: socialCommonQuery.data ?? null,
      }),
    [embeddedSocialGraph, socialFriendsQuery.data, socialCommonQuery.data]
  );

  const socialGraphLoadingFriends = stagedSocial && socialFriendsQuery.isLoading;
  const socialGraphLoadingCommon = loadCommonFollowsPart && socialCommonQuery.isLoading;
  const socialGraphLoading =
    loadSocialGraph &&
    !embeddedSocialGraph &&
    stagedSocial &&
    socialGraphLoadingFriends &&
    !socialGraph?.commonFollows.length;

  const friendRelQuery = useQuery({
    queryKey:
      viewerId && userId && viewerId !== userId
        ? friendRelationshipQueryKey(viewerId, userId)
        : ['friend-relationship', '', ''],
    queryFn: () => fetchFriendRelationship(userId!),
    enabled: Boolean(viewerId && userId && viewerId !== userId),
    staleTime: 15_000,
  });

  const socialGraphKey = userId ? personSocialGraphQueryKey(userId, viewerId) : null;

  const refreshProfile = async () => {
    if (!userId) return;
    await queryClient.invalidateQueries({ queryKey: profileQueryKey });
    if (loadMemberActivities && !embedActivitiesInProfile) {
      await queryClient.invalidateQueries({
        queryKey: personPublicProfileQueryKey(userId, {
          mode: 'person',
          discover: fromDiscover,
          bundleKey: 'upcoming+past',
        }),
      });
    }
    if (loadSocialGraph && socialGraphKey && !embedSocialGraphInProfile) {
      await queryClient.invalidateQueries({ queryKey: personSocialGraphFriendsQueryKey(userId, viewerId) });
      await queryClient.invalidateQueries({ queryKey: personSocialGraphCommonQueryKey(userId, viewerId) });
    }
  };

  const refreshSocialGraph = async () => {
    if (!userId || !loadSocialGraph) return;
    if (embedSocialGraphInProfile) {
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      return;
    }
    if (userId) {
      await queryClient.invalidateQueries({ queryKey: personSocialGraphFriendsQueryKey(userId, viewerId) });
      await queryClient.invalidateQueries({ queryKey: personSocialGraphCommonQueryKey(userId, viewerId) });
    }
  };

  const refreshSocialGraphFriends = async () => {
    if (!userId) return;
    if (embedSocialGraphInProfile) {
      await refreshSocialGraph();
      return;
    }
    const friendsSlice = await fetchMemberProfileSocialGraph(userId, { parts: ['friends'] });
    queryClient.setQueryData(personSocialGraphFriendsQueryKey(userId, viewerId), friendsSlice);
    if (viewerId && viewerId !== userId) {
      const commonSlice = await fetchMemberProfileSocialGraph(userId, { parts: ['commonFollows'] });
      queryClient.setQueryData(personSocialGraphCommonQueryKey(userId, viewerId), commonSlice);
    }
  };

  const upcomingActivities =
    embeddedUpcoming ??
    activitiesBundleQuery.data?.upcomingActivities ??
    [];
  const pastActivities = embeddedPast ?? activitiesBundleQuery.data?.pastActivities ?? [];

  const activitiesLoading =
    loadMemberActivities &&
    !embedActivitiesInProfile &&
    activitiesBundleQuery.isLoading &&
    upcomingActivities.length === 0 &&
    pastActivities.length === 0;

  const setFriendRel = (updater: (prev: FriendRelationshipDTO | null) => FriendRelationshipDTO | null) => {
    if (!viewerId || !userId || viewerId === userId) return;
    const key = friendRelationshipQueryKey(viewerId, userId);
    queryClient.setQueryData<FriendRelationshipDTO | null>(key, (prev) => updater(prev ?? null));
  };

  const reloadFriendRel = () => friendRelQuery.refetch();

  return {
    profile: profile as PersonPublicProfileDTO | null,
    viewerAccess,
    loading: profileQuery.isLoading,
    error: profileError,
    discoveryUpgradeRequired,
    upcomingActivities: upcomingActivities as ActivityDTO[],
    pastActivities: pastActivities as ActivityDTO[],
    activitiesLoading,
    socialGraph,
    socialGraphLoading,
    socialGraphLoadingFriends,
    socialGraphLoadingCommon,
    friendRel: friendRelQuery.data ?? null,
    setFriendRel,
    reloadFriendRel,
    refreshProfile,
    refreshSocialGraph,
    refreshSocialGraphFriends,
  };
};

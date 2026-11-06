import { useCallback, useMemo, type SetStateAction } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatConversationDTO, MemberInboxGroupDTO } from '@uaetrail/shared-types';
import type { UserProfile } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { participantHubQueryKey } from './clientQueryKeys';
import { useJoinedUpcomingPlanData } from './useJoinedUpcomingPlanData';
import { isUpcomingActivity, upcomingActivitiesTotal } from '../utils/activityDates';
import { buildUpcomingPlanRows } from '../utils/activityHubSections';
import { fetchParticipantHubSnapshot } from './participantHubClientApi';

export const useParticipantHubData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    activities,
    requests,
    loading: planLoading,
    error: planError,
    refetch: refetchJoinedPlan,
  } = useJoinedUpcomingPlanData(Boolean(user));

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: user ? participantHubQueryKey(user.id) : ['participant-hub', 'anonymous'],
    queryFn: fetchParticipantHubSnapshot,
    enabled: !!user,
  });

  const profile = data?.profile ?? ({} as UserProfile);
  const conversations = useMemo(() => data?.conversations ?? [], [data?.conversations]);
  const notifications = data?.notifications ?? [];
  const unreadNotifications = data?.unreadNotifications ?? 0;
  const groups = useMemo(() => data?.groups ?? [], [data?.groups]);
  const buddies = data?.buddies ?? [];
  const incomingBuddyRequests = data?.incomingBuddyRequests ?? [];

  const setProfile = useCallback(
    (updater: SetStateAction<UserProfile>) => {
      if (!user) return;
      queryClient.setQueryData(
        participantHubQueryKey(user.id),
        (old: Awaited<ReturnType<typeof fetchParticipantHubSnapshot>> | undefined) => {
          if (!old) return old;
          const nextProfile =
            typeof updater === 'function' ? updater(old.profile) : updater;
          return { ...old, profile: nextProfile };
        }
      );
    },
    [queryClient, user]
  );

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === 'pending'),
    [requests]
  );

  const pastActivitiesCount = useMemo(
    () => activities.filter((a) => !isUpcomingActivity(a)).length,
    [activities]
  );

  const upcomingActivitiesCount = useMemo(
    () => upcomingActivitiesTotal(activities, requests),
    [activities, requests]
  );

  const upcomingPlans = useMemo(
    () => buildUpcomingPlanRows(activities, requests),
    [activities, requests]
  );

  const upcomingActivity = useMemo(
    () => upcomingPlans.find((row) => row.kind === 'confirmed')?.activity,
    [upcomingPlans]
  );

  const unreadMessages = useMemo(() => {
    const direct = conversations.reduce(
      (sum: number, c: ChatConversationDTO) => sum + (c.unreadCount ?? 0),
      0
    );
    const crew = groups.reduce(
      (sum: number, g: MemberInboxGroupDTO) => sum + (g.chatPreview?.unreadCount ?? 0),
      0
    );
    return direct + crew;
  }, [conversations, groups]);

  const reload = useCallback(async () => {
    await Promise.all([refetch(), Promise.resolve(refetchJoinedPlan())]);
  }, [refetch, refetchJoinedPlan]);

  const socialError =
    error instanceof Error ? error.message : error ? 'Failed to load account data' : null;
  const combinedError = socialError ?? planError;

  return {
    profile,
    setProfile,
    activities,
    requests,
    conversations,
    notifications,
    unreadNotifications,
    pendingRequests,
    pastActivitiesCount,
    upcomingActivitiesCount,
    upcomingPlans,
    upcomingActivity,
    unreadMessages,
    groups,
    buddies,
    incomingBuddyRequests,
    profileLoaded: data != null,
    loading: isLoading || planLoading,
    error: combinedError,
    reload,
  };
};

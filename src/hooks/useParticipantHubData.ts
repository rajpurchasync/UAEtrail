import { useCallback, useMemo, type SetStateAction } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BuddyRequestDTO,
  BuddySummaryDTO,
  ChatConversationDTO,
  MemberInboxGroupDTO,
} from '@uaetrail/shared-types';
import type { UserProfile } from '../api/types';
import { fetchMeBuddies, fetchMeBuddyRequests } from './activityInviteClientApi';
import { fetchMeProfile } from './memberProfileApi';
import { fetchMeNotificationsPage } from './notificationInboxApi';
import { participantHubQueryKey } from './clientQueryKeys';
import { useJoinedUpcomingPlanData } from './useJoinedUpcomingPlanData';
import { messagingApi } from '../messaging';
import { useAuth } from '../context/AuthContext';
import { isUpcomingActivity, upcomingActivitiesTotal } from '../utils/activityDates';
import { buildUpcomingPlanRows } from '../utils/activityHubSections';
import {
  isTopCardMessagingNotification,
  sortNotificationsNewestFirst,
} from '../utils/notificationCategories';

async function fetchParticipantHubSocial() {
  const [profile, notifPage, inboxRes, buddies, incomingBuddyRequests] = await Promise.all([
    fetchMeProfile(),
    fetchMeNotificationsPage(1).catch(() => ({
      data: [],
      unreadCount: 0,
      total: 0,
    })),
    messagingApi.getInbox().catch(() => ({
      data: { direct: [] as ChatConversationDTO[], groups: [] as MemberInboxGroupDTO[] },
    })),
    fetchMeBuddies().catch(() => [] as BuddySummaryDTO[]),
    fetchMeBuddyRequests('incoming').catch(() => [] as BuddyRequestDTO[]),
  ]);

  const inbox = inboxRes.data;

  return {
    profile,
    notifications: sortNotificationsNewestFirst(notifPage.data)
      .filter((notif) => isTopCardMessagingNotification(notif))
      .slice(0, 5),
    unreadNotifications: notifPage.unreadCount ?? 0,
    conversations: inbox.direct?.slice(0, 4) ?? [],
    groups: inbox.groups ?? [],
    buddies,
    incomingBuddyRequests: incomingBuddyRequests.filter((request) => request.status === 'pending'),
  };
}

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
    queryFn: fetchParticipantHubSocial,
    enabled: !!user,
  });

  const profile = data?.profile ?? ({} as UserProfile);
  const conversations = data?.conversations ?? [];
  const notifications = data?.notifications ?? [];
  const unreadNotifications = data?.unreadNotifications ?? 0;
  const groups = data?.groups ?? [];
  const buddies = data?.buddies ?? [];
  const incomingBuddyRequests = data?.incomingBuddyRequests ?? [];

  const setProfile = useCallback(
    (updater: SetStateAction<UserProfile>) => {
      if (!user) return;
      queryClient.setQueryData(
        participantHubQueryKey(user.id),
        (old: Awaited<ReturnType<typeof fetchParticipantHubSocial>> | undefined) => {
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
    const direct = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
    const crew = groups.reduce((sum, g) => sum + (g.chatPreview?.unreadCount ?? 0), 0);
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
    loading: isLoading || planLoading,
    error: combinedError,
    reload,
  };
};

import { useCallback, useMemo, type SetStateAction } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BuddyRequestDTO, BuddySummaryDTO, ChatConversationDTO, MyActivityDTO } from '@uaetrail/shared-types';
import { api, ActivityRequestView, UserProfile, SocialGroupView } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { isUpcomingActivity, todayStart, upcomingActivitiesTotal } from '../utils/activityDates';

const participantHubKey = (userId: string) => ['participant-hub', userId] as const;

async function fetchParticipantHub() {
  const [profileRes, activitiesRes, requestsRes, notifRes, convRes, groupsRes, buddiesRes, buddyRequestsRes] =
    await Promise.all([
    api.getMeProfile(),
    api.getMeActivities().catch(() => ({ data: [] as MyActivityDTO[] })),
    api.getMeRequests().catch(() => ({ data: [] as ActivityRequestView[] })),
    api.getMeNotifications(1).catch(() => ({ data: [], unreadCount: 0, total: 0 })),
    api.getConversations().catch(() => ({ data: [] as ChatConversationDTO[] })),
    api.getMeGroups().catch(() => ({ data: [] as SocialGroupView[] })),
    api.getMeBuddies().catch(() => ({ data: [] as BuddySummaryDTO[] })),
    api.getMeBuddyRequests('incoming').catch(() => ({ data: [] as BuddyRequestDTO[] })),
  ]);

  return {
    profile: profileRes.data,
    activities: activitiesRes.data ?? [],
    requests: requestsRes.data ?? [],
    notifications: notifRes.data?.slice(0, 3) ?? [],
    unreadNotifications: notifRes.unreadCount ?? 0,
    conversations: convRes.data?.slice(0, 4) ?? [],
    groups: groupsRes.data ?? [],
    buddies: buddiesRes.data ?? [],
    incomingBuddyRequests: (buddyRequestsRes.data ?? []).filter((request) => request.status === 'pending'),
  };
}

export const useParticipantHubData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: user ? participantHubKey(user.id) : ['participant-hub', 'anonymous'],
    queryFn: fetchParticipantHub,
    enabled: !!user,
  });

  const profile = data?.profile ?? ({} as UserProfile);
  const activities = data?.activities ?? [];
  const requests = data?.requests ?? [];
  const conversations = data?.conversations ?? [];
  const notifications = data?.notifications ?? [];
  const unreadNotifications = data?.unreadNotifications ?? 0;
  const groups = data?.groups ?? [];
  const buddies = data?.buddies ?? [];
  const incomingBuddyRequests = data?.incomingBuddyRequests ?? [];

  const setProfile = useCallback(
    (updater: SetStateAction<UserProfile>) => {
      if (!user) return;
      queryClient.setQueryData(participantHubKey(user.id), (old: Awaited<ReturnType<typeof fetchParticipantHub>> | undefined) => {
        if (!old) return old;
        const nextProfile =
          typeof updater === 'function' ? updater(old.profile) : updater;
        return { ...old, profile: nextProfile };
      });
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

  const upcomingActivity = useMemo(() => {
    const today = todayStart();
    return activities
      .filter((a) => new Date(a.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [activities]);

  const unreadMessages = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
    [conversations]
  );

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

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
    upcomingActivity,
    unreadMessages,
    groups,
    buddies,
    incomingBuddyRequests,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? 'Failed to load account data' : null,
    reload,
  };
};

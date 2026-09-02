import { useCallback, useMemo, type SetStateAction } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityDTO, ChatConversationDTO } from '@uaetrail/shared-types';
import { api, ActivityRequestView, UserProfile, SocialGroupView } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { isUpcomingTrip, todayStart, upcomingTripsTotal } from '../utils/tripDates';

const participantHubKey = (userId: string) => ['participant-hub', userId] as const;

async function fetchParticipantHub() {
  const [profileRes, tripsRes, requestsRes, notifRes, convRes, groupsRes] = await Promise.all([
    api.getMeProfile(),
    api.getMeTrips().catch(() => ({ data: [] as ActivityDTO[] })),
    api.getMeRequests().catch(() => ({ data: [] as ActivityRequestView[] })),
    api.getMeNotifications(1).catch(() => ({ data: [], unreadCount: 0, total: 0 })),
    api.getConversations().catch(() => ({ data: [] as ChatConversationDTO[] })),
    api.getMeGroups().catch(() => ({ data: [] as SocialGroupView[] })),
  ]);

  return {
    profile: profileRes.data,
    trips: tripsRes.data ?? [],
    requests: requestsRes.data ?? [],
    notifications: notifRes.data?.slice(0, 3) ?? [],
    unreadNotifications: notifRes.unreadCount ?? 0,
    conversations: convRes.data?.slice(0, 4) ?? [],
    groups: groupsRes.data ?? [],
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
  const trips = data?.trips ?? [];
  const requests = data?.requests ?? [];
  const conversations = data?.conversations ?? [];
  const notifications = data?.notifications ?? [];
  const unreadNotifications = data?.unreadNotifications ?? 0;
  const groups = data?.groups ?? [];

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

  const pastTripsCount = useMemo(
    () => trips.filter((t) => !isUpcomingTrip(t)).length,
    [trips]
  );

  const upcomingTripsCount = useMemo(
    () => upcomingTripsTotal(trips, requests),
    [trips, requests]
  );

  const upcomingTrip = useMemo(() => {
    const today = todayStart();
    return trips
      .filter((t) => new Date(t.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [trips]);

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
    trips,
    requests,
    conversations,
    notifications,
    unreadNotifications,
    pendingRequests,
    pastTripsCount,
    upcomingTripsCount,
    upcomingTrip,
    unreadMessages,
    groups,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? 'Failed to load account data' : null,
    reload,
  };
};

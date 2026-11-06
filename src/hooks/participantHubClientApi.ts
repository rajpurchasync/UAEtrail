import { api } from '../api/index';
import type { UserProfile } from '../api/types';
import {
  isTopCardMessagingNotification,
  sortNotificationsNewestFirst,
} from '../utils/notificationCategories';

export const fetchParticipantHubSnapshot = async () => {
  const res = await api.getParticipantHub();
  const hub = res.data;
  return {
    profile: hub.profile as UserProfile,
    notifications: sortNotificationsNewestFirst(hub.notifications).filter((notif) =>
      isTopCardMessagingNotification(notif)
    ).slice(0, 5),
    unreadNotifications: hub.unreadNotifications ?? 0,
    conversations: hub.inbox.direct?.slice(0, 4) ?? [],
    groups: hub.inbox.groups ?? [],
    buddies: hub.buddies,
    incomingBuddyRequests: hub.incomingBuddyRequests.filter(
      (request) => request.status === 'pending'
    ),
  };
};

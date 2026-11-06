import type {
  BuddyRequestDTO,
  BuddySummaryDTO,
  ChatConversationDTO,
  MemberInboxGroupDTO,
} from '@uaetrail/shared-types';
import { getAuthenticatedMemberProfile } from './me-profile-read.js';
import { listMyNotifications } from './me-notifications-read.js';
import { loadMemberInbox } from './member-inbox.js';
import { listMyBuddies, listMyBuddyRequests } from './buddy-me-read.js';

export type ParticipantHubSnapshotDTO = {
  profile: Awaited<ReturnType<typeof getAuthenticatedMemberProfile>>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
    meta: unknown;
    createdAt: string;
  }>;
  unreadNotifications: number;
  inbox: {
    direct: ChatConversationDTO[];
    groups: MemberInboxGroupDTO[];
    directConversationsDegraded?: boolean;
  };
  buddies: BuddySummaryDTO[];
  incomingBuddyRequests: BuddyRequestDTO[];
};

/** BFF for profile hub — one round trip instead of five parallel client calls. */
export const loadParticipantHubSnapshot = async (
  userId: string
): Promise<ParticipantHubSnapshotDTO> => {
  const [profile, notifPage, inbox, buddies, buddyRequests] = await Promise.all([
    getAuthenticatedMemberProfile(userId),
    listMyNotifications({ userId, skip: 0, take: 20 }),
    loadMemberInbox(userId),
    listMyBuddies(userId),
    listMyBuddyRequests(userId, 'incoming'),
  ]);

  return {
    profile,
    notifications: notifPage.items.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      type: item.type.toLowerCase(),
      isRead: item.isRead,
      meta: item.meta,
      createdAt:
        item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
    })),
    unreadNotifications: notifPage.unreadCount ?? 0,
    inbox: {
      direct: inbox.direct ?? [],
      groups: inbox.groups ?? [],
      directConversationsDegraded: inbox.directConversationsDegraded,
    },
    buddies,
    incomingBuddyRequests: buddyRequests.filter((request) => request.status === 'pending'),
  };
};

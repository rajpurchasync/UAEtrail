import type { ChatConversationDTO, MemberInboxDTO, MemberInboxGroupDTO } from '@uaetrail/shared-types';
import { findAuthUsersByIds } from '../lib/auth-users.js';
import {
  getLastMessageByPartner,
  getUnreadCountByPartner,
  listConversationPartnerIds,
} from '../lib/chat-data.js';
import { listGroupsForUserWithChatPreview, type GroupRecordWithChatPreview } from '../lib/social-groups-store.js';
import { canMessageUser } from './chat-policy.js';

const serializeInboxGroup = (group: GroupRecordWithChatPreview): MemberInboxGroupDTO => ({
  id: group.id,
  type: group.type,
  name: group.name,
  slogan: group.slogan,
  bannerUrl: group.bannerUrl,
  photoUrl: group.photoUrl,
  adminUserId: group.adminUserId,
  activityId: group.activityId,
  status: group.status,
  wallPostPolicy: group.wallPostPolicy,
  createdAt: group.createdAt.toISOString(),
  updatedAt: group.updatedAt.toISOString(),
  chatPreview: group.chatPreview,
});

export const listMemberDirectConversations = async (userId: string): Promise<ChatConversationDTO[]> => {
  const partnerIds = await listConversationPartnerIds(userId);

  if (partnerIds.length === 0) {
    return [];
  }

  const [partners, unreadCounts] = await Promise.all([
    findAuthUsersByIds(partnerIds),
    getUnreadCountByPartner(userId, partnerIds),
  ]);

  const partnerMap = new Map(partners.map((p) => [p._id, p]));
  const lastMessageMap = await getLastMessageByPartner(userId, partnerIds);

  const conversationRows = await Promise.all(
    partnerIds.map(async (partnerId) => {
      try {
        const allowed = await canMessageUser(userId, partnerId);
        if (!allowed) return null;
      } catch {
        return null;
      }

      const partner = partnerMap.get(partnerId);
      const lastMsg = lastMessageMap.get(partnerId);
      return {
        userId: partnerId,
        displayName: partner?.profile.displayName ?? partner?.email ?? 'Unknown',
        avatarUrl: partner?.profile.avatarUrl ?? undefined,
        lastMessage: lastMsg?.content ?? '',
        lastMessageAt: lastMsg?.createdAt?.toISOString() ?? '',
        unreadCount: unreadCounts.get(partnerId) ?? 0,
      };
    })
  );

  return conversationRows
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
};

export const loadMemberInbox = async (userId: string): Promise<MemberInboxDTO> => {
  const [direct, groups] = await Promise.all([
    listMemberDirectConversations(userId),
    listGroupsForUserWithChatPreview(userId),
  ]);

  return {
    direct,
    groups: groups.map(serializeInboxGroup),
  };
};

import type { ChatConversationDTO, MemberInboxDTO, MemberInboxGroupDTO } from '@uaetrail/shared-types';
import { findAuthUsersByIds } from '../lib/auth-users-store.js';
import {
  getLastMessageByPartner,
  getUnreadCountByPartner,
  listConversationPartnerIds,
} from '../lib/chat-messages-store.js';
import { listGroupsForUserWithChatPreview, type GroupRecordWithChatPreview } from '../lib/social-groups-store.js';
import { filterInboxMessageablePartnerIds } from './chat-policy.js';
import { logger } from '../lib/logger.js';

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

export type MemberDirectConversationsResult = {
  conversations: ChatConversationDTO[];
  policyDegraded?: boolean;
};

export const listMemberDirectConversations = async (
  userId: string
): Promise<MemberDirectConversationsResult> => {
  const partnerIds = await listConversationPartnerIds(userId);

  if (partnerIds.length === 0) {
    return { conversations: [] };
  }

  const [partners, unreadCounts] = await Promise.all([
    findAuthUsersByIds(partnerIds),
    getUnreadCountByPartner(userId, partnerIds),
  ]);

  const partnerMap = new Map(partners.map((p) => [p._id, p]));
  const lastMessageMap = await getLastMessageByPartner(userId, partnerIds);

  let messageableIds: Set<string>;
  try {
    messageableIds = await filterInboxMessageablePartnerIds(userId, partnerIds);
  } catch (error) {
    logger.warn({ err: error, userId }, 'member inbox message policy failed');
    return { conversations: [], policyDegraded: true };
  }

  const conversationRows = partnerIds
    .filter((partnerId) => messageableIds.has(partnerId))
    .map((partnerId) => {
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
    });

  const conversations = conversationRows
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return { conversations, policyDegraded: false };
};

export const loadMemberInbox = async (userId: string): Promise<MemberInboxDTO> => {
  const [directResult, groups] = await Promise.all([
    listMemberDirectConversations(userId),
    listGroupsForUserWithChatPreview(userId),
  ]);

  return {
    direct: directResult.conversations,
    groups: groups.map(serializeInboxGroup),
    directConversationsDegraded: directResult.policyDegraded ?? false,
  };
};

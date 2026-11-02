import { z } from 'zod';
import type { ChatConversationDTO, MemberInboxDTO, MemberInboxGroupDTO } from '@uaetrail/shared-types';
import { findAuthUsersByIds } from '../lib/auth-users-store.js';
import {
  getLastMessageByPartner,
  getUnreadCountByPartner,
  listConversationPartnerIds,
} from '../lib/chat-messages-store.js';
import {
  listGroupsForUserWithChatPreview,
  type GroupRecordWithChatPreview,
  type InboxGroupPreviewFilter,
} from '../lib/social-groups-store.js';
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

export type MemberInboxScope = 'direct' | 'groups' | 'outings' | 'unread';

export const memberInboxQuerySchema = z.object({
  scope: z.enum(['direct', 'groups', 'outings', 'unread']).optional(),
});

export const listMemberDirectConversations = async (
  userId: string,
  options?: { unreadOnly?: boolean }
): Promise<MemberDirectConversationsResult> => {
  const partnerIds = await listConversationPartnerIds(userId);

  if (partnerIds.length === 0) {
    return { conversations: [] };
  }

  const unreadCounts = await getUnreadCountByPartner(userId, partnerIds);
  const scopedIds = options?.unreadOnly
    ? partnerIds.filter((partnerId) => (unreadCounts.get(partnerId) ?? 0) > 0)
    : partnerIds;
  if (scopedIds.length === 0) {
    return { conversations: [] };
  }

  const partners = await findAuthUsersByIds(scopedIds);

  const partnerMap = new Map(partners.map((p) => [p._id, p]));
  const lastMessageMap = await getLastMessageByPartner(userId, scopedIds);

  let messageableIds: Set<string>;
  try {
    messageableIds = await filterInboxMessageablePartnerIds(userId, scopedIds);
  } catch (error) {
    logger.warn({ err: error, userId }, 'member inbox message policy failed');
    return { conversations: [], policyDegraded: true };
  }

  const conversationRows = scopedIds
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

const loadInboxGroups = async (userId: string, filter?: InboxGroupPreviewFilter) => {
  const groups = await listGroupsForUserWithChatPreview(userId, filter);
  return groups.map(serializeInboxGroup);
};

/** Full inbox, or one slice. Omitted scope stays the combined payload other surfaces use. */
export const loadMemberInbox = async (
  userId: string,
  scope?: MemberInboxScope
): Promise<MemberInboxDTO> => {
  if (scope === 'direct') {
    const directResult = await listMemberDirectConversations(userId);
    return {
      direct: directResult.conversations,
      groups: [],
      directConversationsDegraded: directResult.policyDegraded ?? false,
    };
  }

  if (scope === 'groups') {
    return { direct: [], groups: await loadInboxGroups(userId, { kind: 'user' }) };
  }

  if (scope === 'outings') {
    return { direct: [], groups: await loadInboxGroups(userId, { kind: 'activity' }) };
  }

  if (scope === 'unread') {
    const [directResult, groups] = await Promise.all([
      listMemberDirectConversations(userId, { unreadOnly: true }),
      loadInboxGroups(userId, { unreadOnly: true }),
    ]);
    return {
      direct: directResult.conversations,
      groups,
      directConversationsDegraded: directResult.policyDegraded ?? false,
    };
  }

  const [directResult, groups] = await Promise.all([
    listMemberDirectConversations(userId),
    loadInboxGroups(userId),
  ]);

  return {
    direct: directResult.conversations,
    groups,
    directConversationsDegraded: directResult.policyDegraded ?? false,
  };
};

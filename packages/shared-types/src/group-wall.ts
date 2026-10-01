/** Who may post on a social / activity group wall (crew chat). */
export type GroupWallPostPolicy = 'all_members' | 'admins_only';

/** Lightweight inbox row for group / outing chats (no full wall payload). */
export interface SocialGroupChatPreviewDTO {
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

/** Server-enriched quote for `replyToMessageId` (wall GET / POST / SSE). */
export interface GroupWallReplyPreviewDTO {
  messageId: string;
  authorDisplayName: string;
  bodySnippet: string;
}

/** First-line inbox / quote snippet (plain body; no client regex). */
export const groupWallBodySnippet = (body: string): string => {
  const line = body.trim().split('\n')[0] ?? '';
  return line.length > 160 ? `${line.slice(0, 157)}…` : line;
};

/** Wall message author on stream payloads (matches API wall presenter). */
export interface GroupWallMessageAuthorDTO {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

/** Full wall row pushed over SSE (`group_wall_message`). */
export interface GroupWallStreamMessageDTO {
  id: string;
  groupId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
  replyToMessageId?: string | null;
  replyToPreview?: GroupWallReplyPreviewDTO | null;
  author: GroupWallMessageAuthorDTO;
  reactions: { kind: string; count: number; reactedByMe: boolean }[];
}

export interface GroupWallStreamEventDTO {
  groupId: string;
  message: GroupWallStreamMessageDTO;
}

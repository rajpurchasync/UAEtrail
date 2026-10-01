/** Who may post on a social / activity group wall (crew chat). */
export type GroupWallPostPolicy = 'all_members' | 'admins_only';

/** Lightweight inbox row for group / outing chats (no full wall payload). */
export interface SocialGroupChatPreviewDTO {
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

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
  author: GroupWallMessageAuthorDTO;
  reactions: { kind: string; count: number; reactedByMe: boolean }[];
}

export interface GroupWallStreamEventDTO {
  groupId: string;
  message: GroupWallStreamMessageDTO;
}

/** Who may post on a social / activity group wall (crew chat). */
export type GroupWallPostPolicy = 'all_members' | 'admins_only';

/** Lightweight inbox row for group / outing chats (no full wall payload). */
export interface SocialGroupChatPreviewDTO {
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

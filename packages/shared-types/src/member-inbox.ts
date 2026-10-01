import type { GroupWallPostPolicy, SocialGroupChatPreviewDTO } from './group-wall.js';

export type MemberInboxGroupType = 'family' | 'friends' | 'activity';

/** Group row in `GET /chat/inbox` (matches `/me/groups` + chatPreview). */
export interface MemberInboxGroupDTO {
  id: string;
  type: MemberInboxGroupType;
  name: string;
  slogan?: string | null;
  bannerUrl?: string | null;
  photoUrl?: string | null;
  adminUserId: string;
  activityId?: string | null;
  status?: 'active' | 'suspended';
  wallPostPolicy?: GroupWallPostPolicy;
  createdAt: string;
  updatedAt: string;
  chatPreview: SocialGroupChatPreviewDTO;
}


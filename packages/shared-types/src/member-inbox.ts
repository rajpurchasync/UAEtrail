import type { GroupWallPostPolicy, SocialGroupChatPreviewDTO } from './group-wall.js';
import type { MemberGroupInboundType, MemberGroupKind } from './member-group.js';
import type { SocialTeamLabelType } from './social-group-limits.js';

/** @deprecated Use {@link MemberGroupKind} + teamLabel — legacy inbox filter only. */
/** @deprecated Parse with {@link memberGroupKindFromInboundType} — not the Activity entity. */
export type MemberInboxGroupType = MemberGroupInboundType;

/** Group row in `GET /chat/inbox` (matches `/me/groups` + chatPreview). */
export interface MemberInboxGroupDTO {
  id: string;
  kind: MemberGroupKind;
  teamLabel: SocialTeamLabelType | null;
  /** @deprecated Compatibility — use kind + teamLabel. */
  type: MemberGroupInboundType;
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


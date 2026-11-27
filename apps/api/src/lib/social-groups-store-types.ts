import type { GroupWallReplyPreviewDTO, MemberGroupInboundType, MemberGroupKind, SocialTeamLabelType } from '@uaetrail/shared-types';
import type { GroupWallReactionKind } from '../domain/group-wall-reactions.js';

/** @deprecated Use {@link MemberGroupKind} + {@link SocialTeamLabelType}. */
export type GroupType = MemberGroupInboundType;
export type GroupRole = 'admin' | 'member';
export type GroupMemberType = 'adult' | 'kid';
export type GroupInviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export type GroupStatus = 'active' | 'suspended';

export type GroupWallPostPolicy = 'all_members' | 'admins_only';

export type GroupRecord = {
  id: string;
  kind: MemberGroupKind;
  teamLabel: SocialTeamLabelType | null;
  /** @deprecated API compat — derived from kind + teamLabel. */
  type: MemberGroupInboundType;
  name: string;
  slogan: string | null;
  bannerUrl: string | null;
  photoUrl: string | null;
  adminUserId: string;
  activityId: string | null;
  status: GroupStatus;
  wallPostPolicy: GroupWallPostPolicy;
  createdAt: Date;
  updatedAt: Date;
};

export type GroupMemberRecord = {
  id: string;
  groupId: string;
  userId: string | null;
  role: GroupRole;
  memberType: GroupMemberType;
  displayName: string | null;
  invitedEmail: string | null;
  createdByUserId: string;
  createdAt: Date;
  isActive: boolean;
  /** Kid profile — required for outing attach. */
  dateOfBirth?: Date | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  medicalConditions?: string | null;
  gender?: 'male' | 'female' | 'prefer_not_to_say' | null;
  photoUrl?: string | null;
  profileComplete?: boolean;
};

export type GroupInviteRecord = {
  id: string;
  groupId: string;
  invitedByUserId: string;
  email: string;
  role: GroupRole;
  token: string;
  status: GroupInviteStatus;
  acceptedByUserId: string | null;
  acceptedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type GroupWallReactionSummary = {
  kind: GroupWallReactionKind;
  count: number;
  reactedByMe: boolean;
};

export type GroupWallMessageRecord = {
  id: string;
  groupId: string;
  authorUserId: string;
  body: string;
  replyToMessageId?: string | null;
  createdAt: Date;
  reactions?: GroupWallReactionSummary[];
};

export type PresentedGroupWallMessage = GroupWallMessageRecord & {
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  reactions: GroupWallReactionSummary[];
  replyToPreview?: GroupWallReplyPreviewDTO | null;
};

export type ListGroupWallMessagesOptions = {
  limit?: number;
  viewerUserId?: string;
  /** Return messages strictly after this timestamp (ascending, for poll / SSE). */
  since?: Date;
  /** Return messages older than this wall message (compound cursor with createdAt). */
  beforeMessageId?: string;
};

export type ListGroupWallMessagesResult = {
  messages: PresentedGroupWallMessage[];
  /** True when the query hit `limit` and older messages may still exist. */
  hasMoreOlder: boolean;
};
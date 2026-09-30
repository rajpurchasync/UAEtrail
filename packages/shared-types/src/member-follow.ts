export interface MemberFollowSummaryDTO {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  followedAt: string;
}

export interface MemberFollowStateDTO {
  isFollowing: boolean;
  /** Viewer follows this member (one-way). */
  canFollow: boolean;
}

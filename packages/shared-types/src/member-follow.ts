export interface MemberFollowSummaryDTO {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  followedAt: string;
  cityLabel?: string | null;
  lastActiveAt?: string | null;
}

export interface MemberFollowStateDTO {
  isFollowing: boolean;
  /** Viewer follows this member (one-way; host outing alerts only, not demand posts). */
  canFollow: boolean;
}

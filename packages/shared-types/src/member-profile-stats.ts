/** Signed-in member profile counters (followers, outings, community host label). */
export interface MemberProfileStatsDTO {
  followerCount: number;
  joinedCount: number;
  hostedCount: number;
  /** Legacy intent counter (availability migration); product map uses `member_availability` only. */
  activeParticipantIntentCount: number;
  /** True after first published hosted activity or community host signal on profile. */
  isCommunityHost: boolean;
}

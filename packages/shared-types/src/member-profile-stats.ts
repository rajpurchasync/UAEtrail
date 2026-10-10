/** Signed-in member profile counters (followers, outings, community host label). */
export interface MemberProfileStatsDTO {
  followerCount: number;
  joinedCount: number;
  hostedCount: number;
  /** Non-cancelled participant intents (Find / map seeking stub rows). */
  activeParticipantIntentCount: number;
  /** True after first published activity or active participant intent on the map. */
  isCommunityHost: boolean;
}

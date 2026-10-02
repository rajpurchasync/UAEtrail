/** Profile hub stat strip (followers, joined outings, hosted). */
export interface MemberHubStatsDTO {
  followerCount: number;
  joinedCount: number;
  hostedCount: number;
  demandPostCount: number;
  /** True after first published activity or demand post on the map. */
  isCommunityHost: boolean;
}

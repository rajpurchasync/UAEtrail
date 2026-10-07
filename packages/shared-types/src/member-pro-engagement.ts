/** Public member card in Pro browse directory. */
export interface MemberBrowseCardDTO {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
}

/** Profile view analytics for Pro / business storefront owners. */
export interface MemberProfileViewStatsDTO {
  windowDays: number;
  totalViews: number;
  uniqueViewers: number;
}

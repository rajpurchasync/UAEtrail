import type { MemberProfileRoleLabel } from './host-publishing-tier.js';
import type { SocialPersonBuddyRequestState } from './social-people.js';

/** Public member card in Pro browse / Buddies discovery directory. */
export interface MemberBrowseCardDTO {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  /** Short public bio (trimmed server-side). */
  bioPreview?: string | null;
  activitiesAttended?: number;
  profileRoleLabel?: MemberProfileRoleLabel | null;
  canMessage?: boolean;
  canSendBuddyRequest?: boolean;
  buddyRequestState?: SocialPersonBuddyRequestState;
}

/** Profile view analytics for Pro / business storefront owners. */
export interface MemberProfileViewStatsDTO {
  windowDays: number;
  totalViews: number;
  uniqueViewers: number;
}

import type { MemberBrowseCardDTO } from './member-pro-engagement.js';
import type { SocialPersonRowDTO } from './social-people.js';

/** Member with a fixed **availability** pin on explore (`source: availability`). */
export type MemberDiscoveryAvailabilityRowDTO = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  availabilityTitle: string;
  exploreItemId: string;
};

export type MemberDiscoveryRosterDTO = {
  /** Buddies hosting or joining on outings (date filter). */
  friendsGoing: SocialPersonRowDTO[];
  /** Non-friend activity hosts on outings (date filter). */
  hostsGoing: SocialPersonRowDTO[];
  /** Fixed crew availability on explore (not coordination “needs you”). */
  availabilityOnMap: MemberDiscoveryAvailabilityRowDTO[];
  /** People you follow (not already friends) — enriched like directory cards. */
  followed: MemberBrowseCardDTO[];
};
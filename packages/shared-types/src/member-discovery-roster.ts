import type { MemberBrowseCardDTO } from './member-pro-engagement.js';
import type { SocialPersonRowDTO } from './social-people.js';

/** @deprecated Client map helper — roster uses `friendsGoing` / `hostsGoing`. */
export type MemberDiscoveryOnTripRowDTO = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  activityId: string;
  activityTitle: string;
};

/** Member with an active seeking post on the map (`activityMode: seeking`). */
export type MemberDiscoverySeekingRowDTO = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  participantIntentId: string;
  seekingTitle: string;
  exploreItemId: string;
};

export type MemberDiscoveryRosterDTO = {
  /** Buddies hosting or joining on outings (date filter). */
  friendsGoing: SocialPersonRowDTO[];
  /** Non-buddy activity hosts on outings (date filter). */
  hostsGoing: SocialPersonRowDTO[];
  /** Active Find / seeking pins on explore (not coordination “needs you”). */
  seekingOnMap: MemberDiscoverySeekingRowDTO[];
  /** People you follow (not already friends) — enriched like directory cards. */
  followed: MemberBrowseCardDTO[];
};

/** Map peek — host / requester row (not the participant roster). */
export const ACTIVITY_PEEK_SECTION_HOST = 'Host';
export const ACTIVITY_PEEK_SECTION_SPOTS = 'Spots';
export const ACTIVITY_PEEK_FULL_CAPACITY_LABEL = 'Full capacity';
/** @deprecated Use ACTIVITY_PEEK_SECTION_HOST */
export const ACTIVITY_PEEK_SECTION_BUDDIES = ACTIVITY_PEEK_SECTION_HOST;

export const activityPeekPendingInviteChipLabel = (count: number): string =>
  count === 1 ? '1 invited' : `${count} invited`;

/** Organizer viewing their own outing on map peek (`mapPeekStrips.showHostSelfProfileLink`). */
export const ACTIVITY_PEEK_MY_ORGANIZER_PROFILE_SUBTITLE = 'My organizer profile · view profile';

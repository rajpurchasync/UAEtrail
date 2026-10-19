import { UPL_MY_HOST_PROFILE } from './upl-glossary';

/** Map peek — host / requester row (not the participant roster). */
export const ACTIVITY_PEEK_SECTION_HOST = 'Host';
export const ACTIVITY_PEEK_SECTION_SPOTS = 'Spots';
export const ACTIVITY_PEEK_FULL_CAPACITY_LABEL = 'Full capacity';

export const activityPeekPendingInviteChipLabel = (count: number): string =>
  count === 1 ? '1 invited' : `${count} invited`;

/** Host viewing their own outing on map peek (`mapPeekStrips.showHostSelfProfileLink`). */
export const ACTIVITY_PEEK_MY_HOST_PROFILE_SUBTITLE = `${UPL_MY_HOST_PROFILE} · view profile`;

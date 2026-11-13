import type { ActivityPartyMemberDTO, ActivityPartyMemberStatus } from '@uaetrail/shared-types';
import {
  derivePartyHeadcountFromRoster,
  partyRosterHasPendingFamilyInvite,
} from '@uaetrail/shared-types';

export type { ActivityPartyMemberDTO, ActivityPartyMemberStatus };
export { derivePartyHeadcountFromRoster, partyRosterHasPendingFamilyInvite };

export const ACTIVE_PARTY_STATUSES: ActivityPartyMemberStatus[] = [
  'family_invited',
  'accepted',
  'host_pending',
  'confirmed',
];

export const partyMembersForCapacity = (
  partyMembers: ActivityPartyMemberDTO[] | null | undefined
): ActivityPartyMemberDTO[] =>
  (partyMembers ?? []).filter((row) => ACTIVE_PARTY_STATUSES.includes(row.status));

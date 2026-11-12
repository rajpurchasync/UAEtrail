/** Named family companions attached to an outing join request. */
export type ActivityPartyMemberStatus =
  | 'family_invited'
  | 'accepted'
  | 'declined'
  | 'host_pending'
  | 'confirmed';

export type ActivityPartyMemberDTO = {
  membershipId: string;
  groupId: string;
  memberType: 'adult' | 'kid';
  userId: string | null;
  displayName: string;
  status: ActivityPartyMemberStatus;
};

/** Derive outing headcount: primary joiner (1 adult) + roster. */
export const derivePartyHeadcountFromRoster = (
  partyMembers: ActivityPartyMemberDTO[] | null | undefined
): { adults: number; kids: number } => {
  const roster = partyMembers ?? [];
  const familyAdults = roster.filter(
    (row) => row.memberType === 'adult' && row.status !== 'declined'
  ).length;
  const kids = roster.filter(
    (row) => row.memberType === 'kid' && row.status !== 'declined'
  ).length;
  return { adults: 1 + familyAdults, kids };
};

export const partyRosterHasPendingFamilyInvite = (
  partyMembers: ActivityPartyMemberDTO[] | null | undefined
): boolean =>
  (partyMembers ?? []).some(
    (row) => row.memberType === 'adult' && row.status === 'family_invited'
  );

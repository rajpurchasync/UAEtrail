import type { MyActivityRequestDTO } from '@uaetrail/shared-types';
import type { PartyJoinMode } from './partyJoinIntent';

export type PartyEditSeed = {
  mode: PartyJoinMode;
  adults: number;
  kids: number;
  membershipIds: string[];
  teamId: string | null;
};

export const resolvePartyEditSeed = (request: MyActivityRequestDTO): PartyEditSeed => {
  const members = request.partyMembers ?? [];
  if (members.length > 0) {
    const teamId = request.sourceTeamId ?? members[0]?.groupId ?? null;
    return {
      mode: 'team',
      adults: request.adults ?? 1,
      kids: request.kids ?? 0,
      membershipIds: members.map((row) => row.membershipId),
      teamId,
    };
  }

  const adults = request.adults ?? 1;
  const kids = request.kids ?? 0;
  if (adults === 1 && kids === 0) {
    return { mode: 'me', adults, kids, membershipIds: [], teamId: null };
  }
  return { mode: 'headcount', adults, kids, membershipIds: [], teamId: null };
};
import type { ActivityPartyMemberDTO } from '@uaetrail/shared-types';
import { partyRosterHasPendingFamilyInvite } from '@uaetrail/shared-types';
import {
  ACTIVITY_STATUS_JOINED,
  ACTIVITY_STATUS_JOIN_REQUESTED,
} from './activityParticipationCopy';

/** Viewer join chip — Plan, explore, activity detail (not host roster). */
export const ACTIVITY_STATUS_JOINED_WITH_FAMILY = 'Joined with family';
export const ACTIVITY_STATUS_PENDING_WITH_FAMILY = 'Pending with family';
/** Confirmed on the outing; added kids/adults still await host approval. */
export const ACTIVITY_STATUS_JOINED_FAMILY_PENDING = 'Joined · family pending';
/** Adults invited onto the trip; waiting for them to accept before host approval. */
export const ACTIVITY_STATUS_FAMILY_JOINING_PENDING = 'Family joining pending';

export type ViewerParticipationStatusKind =
  | 'joined'
  | 'pending'
  | 'joined_with_family'
  | 'pending_with_family'
  | 'joined_family_pending'
  | 'family_joining_pending'
  | 'waitlisted';

const hasFamilyParty = (adults?: number | null, kids?: number | null): boolean =>
  (typeof adults === 'number' && adults > 1) || (typeof kids === 'number' && kids > 0);

export const resolveViewerParticipationStatus = (input: {
  joinKind: 'open' | 'pending' | 'confirmed';
  adults?: number | null;
  kids?: number | null;
  partyMembers?: ActivityPartyMemberDTO[] | null;
  /** Approved join; headcount increase still waiting on the host. */
  partyApprovalPending?: boolean | null;
  waitlisted?: boolean;
}): { kind: ViewerParticipationStatusKind; label: string } | null => {
  if (input.joinKind === 'open') return null;

  const familyInvitePending = partyRosterHasPendingFamilyInvite(input.partyMembers);
  const familyParty =
    hasFamilyParty(input.adults, input.kids) || (input.partyMembers?.length ?? 0) > 0;

  if (input.joinKind === 'pending') {
    if (input.waitlisted) {
      return { kind: 'waitlisted', label: 'On waitlist' };
    }
    if (familyInvitePending) {
      return { kind: 'family_joining_pending', label: ACTIVITY_STATUS_FAMILY_JOINING_PENDING };
    }
    if (familyParty) {
      return { kind: 'pending_with_family', label: ACTIVITY_STATUS_PENDING_WITH_FAMILY };
    }
    return { kind: 'pending', label: ACTIVITY_STATUS_JOIN_REQUESTED };
  }

  if (familyInvitePending) {
    return { kind: 'family_joining_pending', label: ACTIVITY_STATUS_FAMILY_JOINING_PENDING };
  }
  if (input.partyApprovalPending && familyParty) {
    return { kind: 'joined_family_pending', label: ACTIVITY_STATUS_JOINED_FAMILY_PENDING };
  }
  if (familyParty) {
    return { kind: 'joined_with_family', label: ACTIVITY_STATUS_JOINED_WITH_FAMILY };
  }
  return { kind: 'joined', label: ACTIVITY_STATUS_JOINED };
};

import type { ParticipantDTO } from '@uaetrail/shared-types';

/** Host roll call — pending requests vs roster before/after check-in. */
export type ActivityRollcallStatus = 'pending' | 'joined' | 'attending';

export const activityRollcallStatusFromParticipant = (
  participant: ParticipantDTO
): Exclude<ActivityRollcallStatus, 'pending'> =>
  participant.status === 'attended' ? 'attending' : 'joined';

export const ACTIVITY_ROLLCALL_STATUS_LABEL: Record<ActivityRollcallStatus, string> = {
  pending: 'Pending',
  joined: 'Joined',
  attending: 'Attending',
};

export const activityRollcallStatusBadgeClass = (status: ActivityRollcallStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/15 text-amber-800';
    case 'joined':
      return 'bg-sky-500/12 text-sky-900';
    case 'attending':
      return 'bg-emerald-500/15 text-emerald-800';
    default:
      return 'bg-neutral-500/10 text-neutral-700';
  }
};

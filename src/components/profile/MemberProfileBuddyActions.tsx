import { MessageCircle, UserPlus } from 'lucide-react';
import type { BuddyRelationshipDTO } from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';

export type MemberBuddyConnectionLabel = 'friends' | 'pending_outgoing' | 'pending_incoming' | 'none';

export const resolveMemberBuddyConnectionLabel = (
  buddyRel: BuddyRelationshipDTO | null
): MemberBuddyConnectionLabel => {
  if (!buddyRel) return 'none';
  if (buddyRel.areBuddies) return 'friends';
  if (buddyRel.incomingRequest) return 'pending_incoming';
  if (buddyRel.outgoingRequest) return 'pending_outgoing';
  return 'none';
};

const BuddyStatusPill = ({ label }: { label: MemberBuddyConnectionLabel }) => {
  if (label === 'none') return null;
  const copy =
    label === 'friends'
      ? 'Friends'
      : label === 'pending_outgoing'
        ? 'Pending'
        : 'Request received';
  const tone =
    label === 'friends'
      ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
      : 'bg-amber-50 text-amber-900 ring-amber-200';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${tone}`}
    >
      {copy}
    </span>
  );
};

type MemberProfileBuddyActionsProps = {
  buddyRel: BuddyRelationshipDTO | null;
  buddyBusy: boolean;
  onSendBuddyRequest: () => void;
  onAcceptBuddyRequest: () => void;
  onDeclineBuddyRequest: () => void;
  onCancelBuddyRequest: () => void;
  onMessage: () => void;
};

export const MemberProfileBuddyActions = ({
  buddyRel,
  buddyBusy,
  onSendBuddyRequest,
  onAcceptBuddyRequest,
  onDeclineBuddyRequest,
  onCancelBuddyRequest,
  onMessage,
}: MemberProfileBuddyActionsProps) => {
  const connectionLabel = resolveMemberBuddyConnectionLabel(buddyRel);

  return (
    <div className="mt-4 space-y-2 px-1">
      <div className="flex justify-center">
        <BuddyStatusPill label={connectionLabel} />
      </div>

      {buddyRel?.areBuddies ? (
        <AppButton type="button" fullWidth onClick={onMessage}>
          <MessageCircle className="mr-2 inline h-4 w-4" aria-hidden />
          Message
        </AppButton>
      ) : buddyRel?.incomingRequest ? (
        <div className="flex gap-2">
          <AppButton type="button" className="flex-1" disabled={buddyBusy} onClick={onAcceptBuddyRequest}>
            Accept
          </AppButton>
          <AppButton
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={buddyBusy}
            onClick={onDeclineBuddyRequest}
          >
            Decline
          </AppButton>
        </div>
      ) : buddyRel?.outgoingRequest ? (
        <AppButton
          type="button"
          variant="secondary"
          fullWidth
          disabled={buddyBusy}
          onClick={onCancelBuddyRequest}
        >
          Cancel friend request
        </AppButton>
      ) : buddyRel?.canSendRequest ? (
        <AppButton type="button" fullWidth disabled={buddyBusy} onClick={onSendBuddyRequest}>
          <UserPlus className="mr-2 inline h-4 w-4" aria-hidden />
          Add as friend
        </AppButton>
      ) : null}
    </div>
  );
};

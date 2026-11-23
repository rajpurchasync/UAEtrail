import { MessageCircle, UserPlus } from 'lucide-react';
import type { FriendRelationshipDTO } from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';

export type MemberFriendConnectionLabel = 'friends' | 'pending_outgoing' | 'pending_incoming' | 'none';

export const resolveMemberFriendConnectionLabel = (
  friendRel: FriendRelationshipDTO | null
): MemberFriendConnectionLabel => {
  if (!friendRel) return 'none';
  if (friendRel.areFriends) return 'friends';
  if (friendRel.incomingRequest) return 'pending_incoming';
  if (friendRel.outgoingRequest) return 'pending_outgoing';
  return 'none';
};

const FriendStatusPill = ({ label }: { label: MemberFriendConnectionLabel }) => {
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

type MemberProfileFriendActionsProps = {
  friendRel: FriendRelationshipDTO | null;
  friendActionBusy: boolean;
  onSendFriendRequest: () => void;
  onAcceptFriendRequest: () => void;
  onDeclineFriendRequest: () => void;
  onCancelFriendRequest: () => void;
  onMessage: () => void;
};

export const MemberProfileFriendActions = ({
  friendRel,
  friendActionBusy,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onCancelFriendRequest,
  onMessage,
}: MemberProfileFriendActionsProps) => {
  const connectionLabel = resolveMemberFriendConnectionLabel(friendRel);

  return (
    <div className="mt-4 space-y-2 px-1 lg:px-0">
      <div className="flex justify-center lg:justify-start">
        <FriendStatusPill label={connectionLabel} />
      </div>

      {friendRel?.areFriends ? (
        <AppButton type="button" fullWidth onClick={onMessage}>
          <MessageCircle className="mr-2 inline h-4 w-4" aria-hidden />
          Message
        </AppButton>
      ) : friendRel?.incomingRequest ? (
        <div className="flex gap-2">
          <AppButton type="button" className="flex-1" disabled={friendActionBusy} onClick={onAcceptFriendRequest}>
            Accept
          </AppButton>
          <AppButton
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={friendActionBusy}
            onClick={onDeclineFriendRequest}
          >
            Decline
          </AppButton>
        </div>
      ) : friendRel?.outgoingRequest ? (
        <AppButton
          type="button"
          variant="secondary"
          fullWidth
          disabled={friendActionBusy}
          onClick={onCancelFriendRequest}
        >
          Cancel friend request
        </AppButton>
      ) : friendRel?.canSendRequest ? (
        <AppButton type="button" fullWidth disabled={friendActionBusy} onClick={onSendFriendRequest}>
          <UserPlus className="mr-2 inline h-4 w-4" aria-hidden />
          Add as friend
        </AppButton>
      ) : null}
    </div>
  );
};
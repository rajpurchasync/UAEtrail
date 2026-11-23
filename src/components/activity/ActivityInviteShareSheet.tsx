import { useMemo } from 'react';
import type { ActivityShareInput } from '../../utils/activityShare';
import { buildActivitySharePayload } from '../../utils/activityShare';
import { ActivityInviteModalBody } from './ActivityInviteModalBody';
import { ActivityInviteExploreSheet } from './ActivityInviteExploreSheet';
import { useAuth } from '../../context/AuthContext';

export type ActivityInviteShareSheetProps = {
  open: boolean;
  activity: ActivityShareInput | null;
  canSendFriendInvites?: boolean;
  initialSelectedFriendIds?: string[];
  onClose: () => void;
};

/** Programmatic invite modal (explore peek, activity lists). */
export const ActivityInviteShareSheet = ({
  open,
  activity,
  canSendFriendInvites = false,
  initialSelectedFriendIds,
  onClose,
}: ActivityInviteShareSheetProps) => {
  const { user } = useAuth();
  const share = useMemo(
    () => (activity ? buildActivitySharePayload(activity) : null),
    [activity]
  );

  if (!canSendFriendInvites) return null;

  return (
    <ActivityInviteExploreSheet open={open && Boolean(activity)} onClose={onClose}>
      {activity && share ? (
        <ActivityInviteModalBody
          activityId={activity.id}
          messageWithUrl={share.messageWithUrl}
          initialSelectedFriendIds={initialSelectedFriendIds}
          active={open && Boolean(user)}
          onInviteSent={onClose}
        />
      ) : null}
    </ActivityInviteExploreSheet>
  );
};

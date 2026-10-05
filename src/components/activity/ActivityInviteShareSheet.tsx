import { useMemo } from 'react';
import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';
import type { ActivityShareInput } from '../../utils/activityShare';
import { buildActivitySharePayload } from '../../utils/activityShare';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../content/activityInviteCopy';
import { ActivityInviteModalBody } from './ActivityInviteModalBody';
import { useAuth } from '../../context/AuthContext';

export type ActivityInviteShareSheetProps = {
  open: boolean;
  activity: ActivityShareInput | null;
  canSendBuddyInvites?: boolean;
  initialSelectedBuddyIds?: string[];
  onClose: () => void;
};

/** Programmatic invite modal (explore peek, activity lists). */
export const ActivityInviteShareSheet = ({
  open,
  activity,
  canSendBuddyInvites = false,
  initialSelectedBuddyIds,
  onClose,
}: ActivityInviteShareSheetProps) => {
  const { user } = useAuth();
  const share = useMemo(
    () => (activity ? buildActivitySharePayload(activity) : null),
    [activity]
  );

  if (!canSendBuddyInvites) return null;

  return (
    <ExploreResponsiveSheet
      open={open && Boolean(activity)}
      onClose={onClose}
      title={ACTIVITY_INVITE_FRIENDS_CTA}
      maxWidthClass="max-w-md"
      overlayFixed
      showCloseButton
    >
      {activity && share ? (
        <div className="px-4 pb-6 pt-1">
          <ActivityInviteModalBody
            activityId={activity.id}
            messageWithUrl={share.messageWithUrl}
            initialSelectedBuddyIds={initialSelectedBuddyIds}
            active={open && Boolean(user)}
          />
        </div>
      ) : null}
    </ExploreResponsiveSheet>
  );
};

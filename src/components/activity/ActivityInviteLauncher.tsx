import { useEffect, useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';
import { useAuth } from '../../context/AuthContext';
import { buildActivitySharePayload, type ActivityShareInput } from '../../utils/activityShare';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../content/activityInviteCopy';
import { ActivityInviteModalBody } from './ActivityInviteModalBody';

export type ActivityInviteLauncherProps = {
  activity: ActivityShareInput;
  canSendBuddyInvites?: boolean;
  initialSelectedBuddyIds?: string[];
  /** Open modal once on mount (e.g. plan-with buddy). */
  defaultOpen?: boolean;
  className?: string;
};

/** Single page CTA — opens tabbed friends / groups invite modal. */
export const ActivityInviteLauncher = ({
  activity,
  canSendBuddyInvites = false,
  initialSelectedBuddyIds,
  defaultOpen = false,
  className = '',
}: ActivityInviteLauncherProps) => {
  const { user } = useAuth();
  const share = useMemo(() => buildActivitySharePayload(activity), [activity]);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  if (!canSendBuddyInvites) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm active:bg-emerald-700 ${className}`}
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        {ACTIVITY_INVITE_FRIENDS_CTA}
      </button>

      <ExploreResponsiveSheet
        open={open}
        onClose={() => setOpen(false)}
        title={ACTIVITY_INVITE_FRIENDS_CTA}
        maxWidthClass="max-w-md"
        overlayFixed
        showCloseButton
      >
        <div className="px-4 pb-6 pt-1">
          <ActivityInviteModalBody
            activityId={activity.id}
            messageWithUrl={share.messageWithUrl}
            initialSelectedBuddyIds={initialSelectedBuddyIds}
            active={open && Boolean(user)}
          />
        </div>
      </ExploreResponsiveSheet>
    </>
  );
};

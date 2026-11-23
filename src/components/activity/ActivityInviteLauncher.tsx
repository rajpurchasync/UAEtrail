import { useEffect, useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { buildActivitySharePayload, type ActivityShareInput } from '../../utils/activityShare';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../content/activityInviteCopy';
import { ActivityInviteModalBody } from './ActivityInviteModalBody';
import { ActivityInviteExploreSheet } from './ActivityInviteExploreSheet';

export type ActivityInviteLauncherProps = {
  activity: ActivityShareInput;
  canSendFriendInvites?: boolean;
  initialSelectedFriendIds?: string[];
  /** Open modal once on mount (e.g. plan-with buddy). */
  defaultOpen?: boolean;
  className?: string;
  variant?: 'button' | 'link';
};

/** Single page CTA — opens tabbed friends / groups invite modal. */
export const ActivityInviteLauncher = ({
  activity,
  canSendFriendInvites = false,
  initialSelectedFriendIds,
  defaultOpen = false,
  className = '',
  variant = 'button',
}: ActivityInviteLauncherProps) => {
  const { user } = useAuth();
  const share = useMemo(() => buildActivitySharePayload(activity), [activity]);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  if (!canSendFriendInvites) return null;

  const triggerClass =
    variant === 'link'
      ? `inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 underline underline-offset-2 ${className}`
      : `inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm active:bg-emerald-700 ${className}`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        {variant === 'link' ? (
          ACTIVITY_INVITE_FRIENDS_CTA
        ) : (
          <>
            <UserPlus className="h-4 w-4" aria-hidden />
            {ACTIVITY_INVITE_FRIENDS_CTA}
          </>
        )}
      </button>

      <ActivityInviteExploreSheet open={open} onClose={() => setOpen(false)}>
        <ActivityInviteModalBody
          activityId={activity.id}
          messageWithUrl={share.messageWithUrl}
          initialSelectedFriendIds={initialSelectedFriendIds}
          active={open && Boolean(user)}
          onInviteSent={() => setOpen(false)}
        />
      </ActivityInviteExploreSheet>
    </>
  );
};

import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';
import { ActivityInviteSharePanel } from './ActivityInviteSharePanel';
import type { ActivityShareInput } from '../../utils/activityShare';

export type ActivityInviteShareSheetProps = {
  open: boolean;
  activity: ActivityShareInput | null;
  onClose: () => void;
};

/** Modal invite flow — WhatsApp / link / connections / groups. */
export const ActivityInviteShareSheet = ({
  open,
  activity,
  onClose,
}: ActivityInviteShareSheetProps) => (
  <ExploreResponsiveSheet
    open={open && Boolean(activity)}
    onClose={onClose}
    title="Invite your crew"
    maxWidthClass="max-w-md"
    overlayFixed
  >
    {activity ? (
      <div className="px-4 pb-6">
        <ActivityInviteSharePanel activity={activity} />
      </div>
    ) : null}
  </ExploreResponsiveSheet>
);

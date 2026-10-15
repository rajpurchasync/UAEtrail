import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import { ActivityInviteLauncher } from '../ActivityInviteLauncher';

type ActivityDetailParticipationAffordancesProps = {
  activity: ActivityDetailDTO;
  joinUiState: JoinRequestUiState;
  canInviteFriends: boolean;
};

/** Under spots — invite friends while pending or joined (marketing fold). */
export const ActivityDetailParticipationAffordances = ({
  activity,
  joinUiState,
  canInviteFriends,
}: ActivityDetailParticipationAffordancesProps) => {
  if (!canInviteFriends) return null;
  if (joinUiState.kind !== 'pending') return null;

  const shareActivity = {
    id: activity.id,
    title: activity.title || activity.locationName,
    activityType: activity.activityType,
    date: activity.date,
    locationName: activity.locationName,
  };

  return (
    <div className="flex justify-start">
      <ActivityInviteLauncher
        activity={shareActivity}
        canSendBuddyInvites
        variant="link"
        className="px-0 py-0"
      />
    </div>
  );
};

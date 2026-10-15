import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import { buildActivityDetailPageShellCard } from '../../../activity/detail/activityDetailPageShellCard';
import { ActivityPeekStrips } from '../../../explore/ui/peek/activity/ActivityPeekStrips';
import { activityDetailPath } from '../../../config/routingCatalog';
import { navigateToAuthGate } from '../../../utils/authReturnContext';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';

type ActivityDetailEngagementStripsProps = {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  wireStrips?: ActivityEngagementStripsDTO | null;
  joinUiState: JoinRequestUiState;
  requiresSignIn: boolean;
  onOfferLinkedRideshare?: () => void;
};

/** §6.0 Participants + Logistics strips on activity detail (reuses map peek presentation). */
export const ActivityDetailEngagementStrips = ({
  activity,
  viewerAccess,
  wireStrips,
  joinUiState,
  requiresSignIn,
  onOfferLinkedRideshare,
}: ActivityDetailEngagementStripsProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const card = useMemo(
    () =>
      buildActivityDetailPageShellCard({
        activity,
        viewerAccess,
        wireStrips,
      }),
    [activity, viewerAccess, wireStrips]
  );

  const onGuestGatedAction = requiresSignIn
    ? () =>
        navigateToAuthGate(navigate, location, {
          returnPath: activityDetailPath(activity.id),
        })
    : undefined;

  const onOpenLinkedActivity = (exploreItemId: string) => {
    const activityId = exploreItemId.startsWith('activity:')
      ? exploreItemId.slice('activity:'.length)
      : exploreItemId;
    navigate(activityDetailPath(activityId));
  };

  return (
    <ActivityPeekStrips
      card={card}
      joinUiState={joinUiState}
      onGuestGatedAction={onGuestGatedAction}
      onOpenLinkedPin={onOpenLinkedActivity}
      onOfferTransport={onOfferLinkedRideshare}
    />
  );
};

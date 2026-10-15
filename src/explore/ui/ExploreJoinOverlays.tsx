import type { ActivityDTO } from '@uaetrail/shared-types';
import { activityDetailPath } from '../../config/routingCatalog';
import { JoinRequestModal } from '../../components/ui/JoinRequestModal';
import { WithdrawRequestModal } from '../../components/ui/WithdrawRequestModal';
import type { ActivityJoinActions } from '../../hooks/useActivityJoinFlow';
import {
  ACTIVITY_JOIN_CTA_SELECTOR,
  withAuthResumeQuery,
} from '../../utils/authReturnContext';
import { useLocation } from 'react-router-dom';
import { ExploreGuestJoinSheet } from './ExploreGuestJoinSheet';

interface ExploreJoinOverlaysProps {
  activity: ActivityDTO | null | undefined;
  joinActions: ActivityJoinActions;
  onJoinSuccess?: (message: string) => void;
  exploreMapItemId?: string | null;
  guestPlaceTitle?: string | null;
}

/** Join / withdraw modals and guest sign-up sheet for explore map selection. */
export const ExploreJoinOverlays = ({
  activity,
  joinActions,
  onJoinSuccess,
  exploreMapItemId,
  guestPlaceTitle,
}: ExploreJoinOverlaysProps) => {
  const location = useLocation();
  const browseReturnPath = `${location.pathname}${location.search}`;
  const guestAuthReturnPath =
    joinActions.guestSheetSurface === 'browse'
      ? browseReturnPath
      : activity?.id && joinActions.guestSheetIntent === 'activity'
        ? withAuthResumeQuery(activityDetailPath(activity.id), { join: true })
        : undefined;

  return (
  <>
    {joinActions.joinModalOpen && activity && (
      <JoinRequestModal
        open={joinActions.joinModalOpen}
        onClose={joinActions.closeJoinModal}
        activity={activity}
        exploreMapItemId={exploreMapItemId}
        overlayClassName="z-[6000]"
        onSuccess={onJoinSuccess ?? joinActions.handleJoinSuccess}
      />
    )}

    {activity && (
      <WithdrawRequestModal
        open={joinActions.showWithdraw}
        onClose={() => joinActions.setShowWithdraw(false)}
        activityTitle={activity.title ?? 'this activity'}
        activityDate={activity.date}
        variant={joinActions.withdrawVariant}
        submitting={joinActions.withdrawing}
        onConfirm={joinActions.handleWithdraw}
      />
    )}

    <ExploreGuestJoinSheet
      open={joinActions.guestSheetOpen}
      onClose={joinActions.closeGuestSheet}
      intent={joinActions.guestSheetIntent}
      browseGateIntent={
        joinActions.guestSheetSurface === 'browse' ? joinActions.guestBrowseGateIntent : null
      }
      activityTitle={
        joinActions.guestSheetIntent === 'place'
          ? guestPlaceTitle ?? undefined
          : activity?.title || activity?.locationName || undefined
      }
      participationMode={activity?.participationMode}
      requirements={activity?.requirements}
      authReturnPath={guestAuthReturnPath}
      authFocusSelector={
        joinActions.guestSheetSurface === 'join' && guestAuthReturnPath
          ? ACTIVITY_JOIN_CTA_SELECTOR
          : undefined
      }
    />
  </>
  );
};

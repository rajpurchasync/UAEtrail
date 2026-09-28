import type { ActivityDTO } from '@uaetrail/shared-types';
import { JoinRequestModal } from '../../components/ui/JoinRequestModal';
import { WithdrawRequestModal } from '../../components/ui/WithdrawRequestModal';
import type { ActivityJoinActions } from '../../hooks/useActivityJoinFlow';
import { ExploreGuestJoinSheet } from './ExploreGuestJoinSheet';

interface ExploreJoinOverlaysProps {
  activity: ActivityDTO | null | undefined;
  joinActions: ActivityJoinActions;
  guestPlaceTitle?: string | null;
}

/** Join / withdraw modals and guest sign-up sheet for explore map selection. */
export const ExploreJoinOverlays = ({
  activity,
  joinActions,
  guestPlaceTitle,
}: ExploreJoinOverlaysProps) => (
  <>
    {joinActions.joinModalOpen && activity && (
      <JoinRequestModal
        open={joinActions.joinModalOpen}
        onClose={joinActions.closeJoinModal}
        activity={activity}
        overlayClassName="z-[6000]"
        onSuccess={joinActions.handleJoinSuccess}
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
      activityTitle={
        joinActions.guestSheetIntent === 'place'
          ? guestPlaceTitle ?? undefined
          : activity?.title || activity?.locationName || undefined
      }
      participationMode={activity?.participationMode}
      requirements={activity?.requirements}
    />
  </>
);

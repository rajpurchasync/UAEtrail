import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';
import { EXPLORE_SHEET, EXPLORE_Z } from '../../config/exploreTheme';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../content/activityInviteCopy';
import { ACTIVITY_PEEK_MANAGE_LABEL } from '../../content/activityParticipationCopy';
import { JOIN_CANCEL_REQUEST_BUTTON, JOIN_WITHDRAW_APPROVED_REQUEST_BUTTON } from '../../content/joinWithdrawCopy';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { withdrawModalVariant } from '../../utils/joinRequestUi';

export type ActivityParticipationManageSheetProps = {
  open: boolean;
  joinUiState: JoinRequestUiState;
  onClose: () => void;
  onInviteFriends: () => void;
  onWithdraw: () => void;
};

/** Participant Manage — invite friends + withdraw (peek Manage opens detail; detail opens this sheet). */
export const ActivityParticipationManageSheet = ({
  open,
  joinUiState,
  onClose,
  onInviteFriends,
  onWithdraw,
}: ActivityParticipationManageSheetProps) => {
  const withdrawLabel =
    withdrawModalVariant(joinUiState) === 'activity'
      ? JOIN_WITHDRAW_APPROVED_REQUEST_BUTTON
      : JOIN_CANCEL_REQUEST_BUTTON;

  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      title={ACTIVITY_PEEK_MANAGE_LABEL}
      maxWidthClass={EXPLORE_SHEET.compactMaxWidth}
      zClass={EXPLORE_Z.activityDetailInviteSheet}
      overlayFixed
      showCloseButton
    >
      <div className="space-y-2 px-4 pb-6 pt-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onInviteFriends();
          }}
          className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm font-semibold text-neutral-900 active:bg-neutral-50"
        >
          {ACTIVITY_INVITE_FRIENDS_CTA}
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onWithdraw();
          }}
          className="flex w-full items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-800 active:bg-red-100/80"
        >
          {withdrawLabel}
        </button>
      </div>
    </ExploreResponsiveSheet>
  );
};

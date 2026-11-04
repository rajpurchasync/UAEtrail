import type { ParticipationMode } from '@uaetrail/shared-types';
import type { GuestJoinSheetIntent } from '../../content/guestJoinCopy';
import type { GuestBrowseGateIntent } from '../../content/guestBrowseGateCopy';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { useMinWidthMd } from '../../hooks/useMinWidthMd';
import { EXPLORE_DESKTOP_POPUP } from '../exploreDesktopPopup';
import { GuestFeatureUnlockPanelFromIntent } from './GuestFeatureUnlockPanel';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

interface ExploreGuestJoinSheetProps {
  open: boolean;
  onClose: () => void;
  activityTitle?: string;
  intent?: GuestJoinSheetIntent;
  participationMode?: ParticipationMode | null;
  requirements?: string[] | null;
  authReturnPath?: string;
  authFocusSelector?: string;
  /** Browse / detail gates (map peek strips, shop view) — not join copy. */
  browseGateIntent?: GuestBrowseGateIntent | null;
}

/** Guest gate sheet — centered popup on md+, bottom-weighted on small phones. */
export const ExploreGuestJoinSheet = ({
  open,
  onClose,
  authReturnPath,
  authFocusSelector,
  browseGateIntent = null,
}: ExploreGuestJoinSheetProps) => {
  const desktopPopup = useMinWidthMd();

  const content = (
    <>
      <GuestFeatureUnlockPanelFromIntent
        intent={browseGateIntent ?? 'join-activity'}
        presentation={desktopPopup ? 'dialog' : 'card'}
        className={desktopPopup ? 'border-0 bg-transparent p-0 shadow-none ring-0' : undefined}
        authReturnPath={authReturnPath}
        authFocusSelector={authFocusSelector}
      />
      <button type="button" onClick={onClose} className={EXPLORE_DESKTOP_POPUP.dismissLink}>
        Keep browsing
      </button>
    </>
  );

  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      zClass={EXPLORE_Z.guestJoinSheet}
      overlayFixed
      layout="centered"
      showCloseButton
      showHandle={false}
      ariaLabel="Sign up to use this feature"
      viewportAdaptive={desktopPopup}
    >
      {desktopPopup ? content : <div className="px-4 pb-5 pt-8 sm:px-6 sm:pb-6">{content}</div>}
    </ExploreResponsiveSheet>
  );
};

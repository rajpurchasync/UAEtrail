import type { ParticipationMode } from '@uaetrail/shared-types';
import type { GuestJoinSheetIntent } from '../../content/guestJoinCopy';
import type { GuestBrowseGateIntent } from '../../content/guestBrowseGateCopy';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
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

/** Centered sign-in modal when a guest taps Join — uses shared sign-in card. */
export const ExploreGuestJoinSheet = ({
  open,
  onClose,
  activityTitle,
  intent = 'activity',
  participationMode,
  requirements,
  authReturnPath,
  authFocusSelector,
  browseGateIntent = null,
}: ExploreGuestJoinSheetProps) => (
  <ExploreResponsiveSheet
    open={open}
    onClose={onClose}
    maxWidthClass="max-w-md"
    zClass={EXPLORE_Z.guestJoinSheet}
    overlayFixed
    layout="centered"
    showCloseButton
    showHandle={false}
    ariaLabel={browseGateIntent ? 'Sign in to continue' : 'Sign in to join'}
  >
    <div className="px-4 pb-5 pt-8 sm:px-6 sm:pb-6">
      <ExploreGuestSignInCard
        intent={browseGateIntent ?? 'join-activity'}
        joinIntent={browseGateIntent ? undefined : intent}
        activityTitle={activityTitle}
        participationMode={browseGateIntent ? undefined : participationMode}
        requirements={browseGateIntent ? undefined : requirements}
        authReturnPath={authReturnPath}
        authFocusSelector={authFocusSelector}
        compact
      />
      <button
        type="button"
        onClick={onClose}
        className="mt-2 block w-full py-2 text-center text-sm font-medium text-neutral-400"
      >
        Keep browsing
      </button>
    </div>
  </ExploreResponsiveSheet>
);

import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

type GuestComposeSignInSheetProps = {
  open: boolean;
  onClose: () => void;
  /** After auth, reopen the create wizard (`?compose=` on current surface). */
  authReturnPath?: string | null;
};

/** Sign-in gate for guests starting a create flow from Explore or List. */
export const GuestComposeSignInSheet = ({
  open,
  onClose,
  authReturnPath,
}: GuestComposeSignInSheetProps) => (
  <ExploreResponsiveSheet
    open={open}
    onClose={onClose}
    maxWidthClass="max-w-md"
    zClass={EXPLORE_Z.guestJoinSheet}
    overlayFixed
    layout="centered"
    showCloseButton
    showHandle={false}
    ariaLabel="Sign in to continue"
  >
    <div className="px-4 pb-5 pt-8 sm:px-6 sm:pb-6">
      <ExploreGuestSignInCard intent="peek-details" compact authReturnPath={authReturnPath ?? undefined} />
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

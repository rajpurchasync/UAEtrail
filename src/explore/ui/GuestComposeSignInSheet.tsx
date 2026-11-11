import { useMinWidthMd } from '../../hooks/useMinWidthMd';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { EXPLORE_DESKTOP_POPUP } from '../exploreDesktopPopup';
import { GuestFeatureUnlockPanel } from './GuestFeatureUnlockPanel';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

type GuestComposeSignInSheetProps = {
  open: boolean;
  onClose: () => void;
  /** After auth, reopen the create wizard (`?compose=` on current surface). */
  authReturnPath?: string | null;
};

/** Sign-in gate for guests starting a create flow from Explore or List (mobile sheet). */
export const GuestComposeSignInSheet = ({
  open,
  onClose,
  authReturnPath,
}: GuestComposeSignInSheetProps) => {
  const desktopPopup = useMinWidthMd();

  const content = (
    <>
      <GuestFeatureUnlockPanel
        feature="post-on-map"
        presentation={desktopPopup ? 'dialog' : 'card'}
        className={desktopPopup ? 'border-0 bg-transparent p-0 shadow-none ring-0' : undefined}
        authReturnPath={authReturnPath ?? undefined}
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
      composePlainClose
      showHandle={false}
      ariaLabel="Sign up to post on the map"
      viewportAdaptive={desktopPopup}
    >
      {desktopPopup ? content : <div className="px-4 pb-5 pt-8 sm:px-6 sm:pb-6">{content}</div>}
    </ExploreResponsiveSheet>
  );
};

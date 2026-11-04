import { useRef } from 'react';
import { X } from 'lucide-react';
import type { GuestBrowseGateIntent } from '../../content/guestBrowseGateCopy';
import type { GuestFeatureUnlockKey } from '../../content/guestFeatureUnlockCopy';
import { EXPLORE_SHEET } from '../../config/exploreTheme';
import { EXPLORE_DESKTOP_POPUP } from '../exploreDesktopPopup';
import { useModalA11y } from '../../hooks/useModalA11y';
import {
  GuestFeatureUnlockPanel,
  GuestFeatureUnlockPanelFromIntent,
} from './GuestFeatureUnlockPanel';

type Props = {
  intent?: GuestBrowseGateIntent;
  feature?: GuestFeatureUnlockKey;
  onClose: () => void;
  authReturnPath?: string;
  authFocusSelector?: string;
  ariaLabel?: string;
};

/** Desktop explore (md+) — centered popup over the map + sign up / log in. */
export const ExploreDesktopGuestGatePanel = ({
  intent = 'peek-details',
  feature,
  onClose,
  authReturnPath,
  authFocusSelector,
  ariaLabel = 'Members-only feature',
}: Props) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(true, onClose, dialogRef);

  return (
    <div className={`${EXPLORE_DESKTOP_POPUP.scrimShell} ${EXPLORE_SHEET.scrim}`}>
      <button type="button" className="absolute inset-0 z-0" aria-label="Close" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={EXPLORE_DESKTOP_POPUP.panel}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={EXPLORE_DESKTOP_POPUP.closeButton}
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <div className={EXPLORE_DESKTOP_POPUP.body}>
          {feature ? (
            <GuestFeatureUnlockPanel
              feature={feature}
              presentation="dialog"
              authReturnPath={authReturnPath}
              authFocusSelector={authFocusSelector}
            />
          ) : (
            <GuestFeatureUnlockPanelFromIntent
              intent={intent}
              presentation="dialog"
              authReturnPath={authReturnPath}
              authFocusSelector={authFocusSelector}
            />
          )}
          <button type="button" onClick={onClose} className={EXPLORE_DESKTOP_POPUP.dismissLink}>
            Keep browsing
          </button>
        </div>
      </div>
    </div>
  );
};

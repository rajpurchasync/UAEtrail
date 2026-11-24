import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { CONSUMER_MODAL_CLOSE } from '../../config/consumerSurfaceTypography';
import { EXPLORE_SHEET, EXPLORE_Z } from '../../config/exploreTheme';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../content/activityInviteCopy';
import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';

type ActivityInviteExploreSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  zClass?: string;
};

/** Invite friends — compact slide-up (mobile) / centered dialog (sm+), aligned with ConsumerBottomSheet. */
export const ActivityInviteExploreSheet = ({
  open,
  onClose,
  children,
  zClass = EXPLORE_Z.shareSheet,
}: ActivityInviteExploreSheetProps) => (
  <ExploreResponsiveSheet
    open={open}
    onClose={onClose}
    ariaLabel={ACTIVITY_INVITE_FRIENDS_CTA}
    maxWidthClass={EXPLORE_SHEET.compactMaxWidth}
    zClass={zClass}
    overlayFixed
    pullToDismiss
    showCloseButton={false}
    panelClassName={`flex max-h-[min(88dvh,720px)] flex-col overflow-hidden ${EXPLORE_SHEET.compactPanelClass}`}
  >
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
      <div className="w-9 shrink-0" aria-hidden />
      <h2 className="min-w-0 flex-1 truncate text-center text-[15px] font-bold text-neutral-900">
        {ACTIVITY_INVITE_FRIENDS_CTA}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className={CONSUMER_MODAL_CLOSE.buttonCompact}
        aria-label="Close"
      >
        <X className={CONSUMER_MODAL_CLOSE.iconCompact} aria-hidden />
      </button>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-1">{children}</div>
  </ExploreResponsiveSheet>
);

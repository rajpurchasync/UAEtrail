import { X } from 'lucide-react';
import { CONSUMER_MODAL_CLOSE } from '../../config/consumerSurfaceTypography';
import { EXPLORE_SHEET, EXPLORE_Z } from '../../config/exploreTheme';
import { ACTIVITY_DETAIL_TAB_FOOTER_SHARE_OUTING } from '../../content/activityDetailCopy';
import { ExploreResponsiveSheet } from '@/discovery/discoveryPortExploreResponsiveSheet';
import {
  ActivityOutingShareMenuBody,
  type ActivityOutingSharePayload,
} from './ActivityOutingShareMenuBody';

export type ActivityOutingShareSheetProps = {
  open: boolean;
  onClose: () => void;
  sharePayload: ActivityOutingSharePayload | null;
  title?: string;
  onInviteOnApp?: () => void;
  showInviteOnApp?: boolean;
  zClass?: string;
};

/** Outing share — in-app invite + external link (all host/participant entry points). */
export const ActivityOutingShareSheet = ({
  open,
  onClose,
  sharePayload,
  title = ACTIVITY_DETAIL_TAB_FOOTER_SHARE_OUTING,
  onInviteOnApp,
  showInviteOnApp = true,
  zClass = EXPLORE_Z.activityDetailInviteSheet,
}: ActivityOutingShareSheetProps) => {
  if (!sharePayload) return null;

  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      title={title}
      ariaLabel={title}
      overlayFixed
      pullToDismiss
      zClass={zClass}
      maxWidthClass={EXPLORE_SHEET.compactMaxWidth}
      panelClassName={`flex h-auto max-h-[min(85dvh,640px)] flex-col overflow-hidden ${EXPLORE_SHEET.compactPanelClass}`}
      showCloseButton={false}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
        <div className="w-9 shrink-0" aria-hidden />
        <h2 className="min-w-0 flex-1 truncate text-center text-[15px] font-bold text-neutral-900">
          {title}
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
      <div className="min-h-0 overflow-y-auto overscroll-contain">
        <ActivityOutingShareMenuBody
          sharePayload={sharePayload}
          onInviteOnApp={onInviteOnApp}
          showInviteOnApp={showInviteOnApp}
        />
      </div>
    </ExploreResponsiveSheet>
  );
};

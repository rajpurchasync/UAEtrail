import { X } from 'lucide-react';
import { EXPLORE_SHEET, EXPLORE_Z } from '../../config/exploreTheme';
import { SHARE_SHEET_TITLE_DEFAULT } from '../../content/shareSheetCopy';
import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';
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
  title = SHARE_SHEET_TITLE_DEFAULT,
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden />
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

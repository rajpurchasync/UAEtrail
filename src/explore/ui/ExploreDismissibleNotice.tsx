import { X } from 'lucide-react';
import { EXPLORE_MOBILE_MAP_CHROME } from '../../config/exploreTheme';

type ExploreDismissibleNoticeProps = {
  message: string;
  onDismiss: () => void;
};

export const ExploreDismissibleNotice = ({ message, onDismiss }: ExploreDismissibleNoticeProps) => (
  <div
    className={`absolute left-4 right-4 top-3 z-[1100] rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow lg:top-4 ${EXPLORE_MOBILE_MAP_CHROME.noticeTop}`}
  >
    <div className="flex items-start justify-between gap-3">
      <p>{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="-m-1 shrink-0 rounded-lg p-1 text-emerald-700 hover:bg-emerald-100/80 active:bg-emerald-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
);

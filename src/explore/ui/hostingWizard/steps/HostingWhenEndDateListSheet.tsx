import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { EXPLORE_Z } from '../../../../config/exploreTheme';
import {
  formatHostingScheduleFullDate,
  hostingScheduleSpanLabel,
} from '../../hostingScheduleDraft';

type EndDateOption = { iso: string; label: string; day: number };

/** Tap-to-open scroll list — up to 30 days from the outing start (no month grid). */
export const HostingWhenEndDateListSheet = ({
  open,
  onClose,
  startDate,
  selectedDate,
  options,
  onSelectDate,
}: {
  open: boolean;
  onClose: () => void;
  startDate: string;
  selectedDate: string;
  options: EndDateOption[];
  onSelectDate: (iso: string) => void;
}) => {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${EXPLORE_Z.guestJoinSheet} flex items-end justify-center bg-black/30 p-4 pb-[max(1rem,var(--safe-bottom))] sm:items-center`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Choose end date"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-neutral-100 px-4 py-3">
          <p className="text-base font-bold text-neutral-900">Ends on</p>
          <p className="text-xs text-neutral-500">Up to 30 days from your start date</p>
        </div>
        <ul className="max-h-[min(55vh,22.5rem)] overflow-y-auto overscroll-contain p-2">
          {options.map((option) => {
            const active = option.iso === selectedDate;
            const spanHint = hostingScheduleSpanLabel(startDate, option.iso);
            return (
              <li key={option.iso}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDate(option.iso);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    active ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-neutral-50'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-neutral-900">
                      {formatHostingScheduleFullDate(option.iso)}
                    </span>
                    <span className="block text-xs font-medium text-sky-700">{spanHint}</span>
                  </span>
                  {active ? (
                    <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <span className="h-5 w-5 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="border-t border-neutral-100 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
};

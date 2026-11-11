import { createPortal } from 'react-dom';
import { MobileMonthCalendar } from '../../../../components/mobile/MobileMonthCalendar';
import { EXPLORE_Z } from '../../../../config/exploreTheme';

/** Month grid overlay — keeps the when step compact; chips stay primary. */
export const HostingWhenDateCalendarPopover = ({
  open,
  onClose,
  selectedDate,
  onSelectDate,
  minDate,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  minDate?: string;
}) => {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${EXPLORE_Z.guestJoinSheet} flex items-end justify-center bg-black/30 p-4 pb-[max(1rem,var(--safe-bottom))] sm:items-center`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Choose a date"
        onClick={(event) => event.stopPropagation()}
      >
        <MobileMonthCalendar
          selectedDate={selectedDate}
          minDate={minDate}
          onSelectDate={(iso) => {
            onSelectDate(iso);
            onClose();
          }}
        />
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-neutral-700 hover:bg-white/80"
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
};

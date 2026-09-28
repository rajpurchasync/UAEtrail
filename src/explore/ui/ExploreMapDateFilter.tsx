import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { EXPLORE_FLOATING_CONTROL } from '../../config/exploreTheme';
import { formatExploreActivityDateLabel } from '../routing';
import { todayIso } from './organizeFlow';
import { MobileMonthCalendar } from '../../components/mobile/MobileMonthCalendar';

interface ExploreMapDateFilterProps {
  activityDate: string | null;
  onActivityDateChange: (iso: string | null) => void;
  scheduledDates?: readonly string[];
}

/** Map calendar control — filter pins to outings on a chosen day. */
export const ExploreMapDateFilter = ({
  activityDate,
  onActivityDateChange,
  scheduledDates = [],
}: ExploreMapDateFilterProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const selected = activityDate ?? todayIso();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const handleSelect = (iso: string) => {
    onActivityDateChange(iso);
    setOpen(false);
  };

  const active = Boolean(activityDate);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${EXPLORE_FLOATING_CONTROL} touch-target-inline h-11 min-w-11 items-center justify-center gap-1.5 px-3 text-emerald-800 ${
          active ? 'ring-2 ring-emerald-500/40' : ''
        }`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={active ? `Activities on ${formatExploreActivityDateLabel(activityDate!)}` : 'Filter map by date'}
        title={active ? formatExploreActivityDateLabel(activityDate!) : 'Pick a date'}
      >
        <CalendarDays className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
        {active ? (
          <span className="max-w-[7rem] truncate text-xs font-bold">{formatExploreActivityDateLabel(activityDate!)}</span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Choose activity date"
          className={`absolute right-0 top-[calc(100%+0.5rem)] z-[3100] w-[min(100vw-2rem,20rem)]`}
        >
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,.18)]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-neutral-900">Activities on…</p>
              {active ? (
                <button
                  type="button"
                  onClick={() => {
                    onActivityDateChange(null);
                    setOpen(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Clear
                </button>
              ) : null}
            </div>
            <MobileMonthCalendar
              selectedDate={selected}
              onSelectDate={handleSelect}
              minDate={todayIso()}
              markedDates={scheduledDates.length > 0 ? new Set(scheduledDates) : undefined}
            />
            {scheduledDates.length > 0 ? (
              <p className="mt-2 text-[11px] leading-snug text-neutral-500">
                Green dots mark days with outings on the map.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

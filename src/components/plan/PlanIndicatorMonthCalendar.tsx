import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { todayIso } from '../../explore';
import type { PlanCalendarDayMarkers } from '../../plan/planCalendarMarkers';
import { emptyPlanCalendarDayMarkers } from '../../plan/planCalendarMarkers';

const toIso = (year: number, month: number, day: number): string =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const parseIso = (iso: string): { year: number; month: number; day: number } => {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month: month - 1, day };
};

const dotClass: Record<'available' | 'hosting' | 'mapSlot' | 'joined' | 'requested', string> = {
  available: 'bg-emerald-500',
  hosting: 'bg-amber-500',
  mapSlot: 'bg-violet-500',
  joined: 'bg-sky-500',
  requested: 'bg-sky-300',
};

const DayDots = ({ markers }: { markers: PlanCalendarDayMarkers }) => {
  const keys: Array<keyof typeof dotClass> = [];
  if (markers.available) keys.push('available');
  if (markers.hosting) keys.push('hosting');
  if (markers.mapSlot) keys.push('mapSlot');
  if (markers.joined) keys.push('joined');
  if (markers.requested) keys.push('requested');
  if (keys.length === 0) return null;
  return (
    <span className="absolute bottom-0.5 flex gap-0.5" aria-hidden>
      {keys.slice(0, 4).map((key) => (
        <span key={key} className={`h-1 w-1 rounded-full ${dotClass[key]}`} />
      ))}
    </span>
  );
};

export type PlanIndicatorMonthCalendarProps = {
  markersByDay: ReadonlyMap<string, PlanCalendarDayMarkers>;
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  minDate?: string;
};

export const PlanIndicatorMonthCalendar = ({
  markersByDay,
  selectedDate,
  onSelectDate,
  minDate = todayIso(),
}: PlanIndicatorMonthCalendarProps) => {
  const initial = parseIso(selectedDate ?? minDate);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  const min = parseIso(minDate);
  const minTimestamp = new Date(min.year, min.month, min.day).getTime();

  const cells = useMemo(() => {
    const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const rows: Array<{ iso: string; day: number; disabled: boolean } | null> = [];
    for (let i = 0; i < startWeekday; i += 1) rows.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = toIso(viewYear, viewMonth, day);
      const ts = new Date(viewYear, viewMonth, day).getTime();
      rows.push({ iso, day, disabled: ts < minTimestamp });
    }
    return rows;
  }, [viewYear, viewMonth, minTimestamp]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-full p-1.5 text-gray-600 hover:bg-white"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-bold text-gray-900">{monthLabel}</p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-full p-1.5 text-gray-600 hover:bg-white"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell) return <span key={`empty-${index}`} />;
          const active = cell.iso === selectedDate;
          const markers = markersByDay.get(cell.iso) ?? emptyPlanCalendarDayMarkers();
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={cell.disabled}
              onClick={() => onSelectDate(cell.iso)}
              className={`relative flex h-10 flex-col items-center justify-center rounded-xl text-sm font-semibold ${
                active
                  ? 'bg-neutral-900 text-white'
                  : cell.disabled
                    ? 'text-gray-300'
                    : 'text-gray-800 hover:bg-white'
              }`}
            >
              {cell.day}
              <DayDots markers={markers} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

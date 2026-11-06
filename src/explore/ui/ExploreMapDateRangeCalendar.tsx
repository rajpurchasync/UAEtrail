import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const toIso = (year: number, month: number, day: number): string =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const parseIso = (iso: string): { year: number; month: number; day: number } => {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month: month - 1, day };
};

type ExploreMapDateRangeCalendarProps = {
  rangeStart: string | null;
  rangeEnd: string | null;
  onPickDate: (iso: string) => void;
};

/** Compact month grid for picking an inclusive start–end range. */
export const ExploreMapDateRangeCalendar = ({
  rangeStart,
  rangeEnd,
  onPickDate,
}: ExploreMapDateRangeCalendarProps) => {
  const seed = parseIso(rangeStart ?? new Date().toISOString().slice(0, 10));
  const [viewYear, setViewYear] = useState(seed.year);
  const [viewMonth, setViewMonth] = useState(seed.month);

  const cells = useMemo(() => {
    const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const rows: Array<{ iso: string; day: number } | null> = [];
    for (let i = 0; i < startWeekday; i += 1) rows.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      rows.push({ iso: toIso(viewYear, viewMonth, day), day });
    }
    return rows;
  }, [viewYear, viewMonth]);

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
    <div>
      <div className="mb-2 flex items-center justify-between px-0.5">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <p className="text-[13px] font-semibold text-neutral-950">{monthLabel}</p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
        {WEEKDAYS.map((label) => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          if (!cell) return <span key={`empty-${index}`} className="h-9" />;
          const isStart = rangeStart === cell.iso;
          const isEnd = rangeEnd === cell.iso;
          const inRange =
            Boolean(rangeStart && rangeEnd) &&
            rangeStart != null &&
            rangeEnd != null &&
            cell.iso > rangeStart &&
            cell.iso < rangeEnd;
          const edge = isStart || isEnd;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onPickDate(cell.iso)}
              className={`relative h-9 text-[13px] font-semibold transition-colors ${
                edge
                  ? 'z-[1] bg-emerald-600 text-white'
                  : inRange
                    ? 'bg-emerald-50 text-emerald-950'
                    : 'text-neutral-800 hover:bg-neutral-100'
              } ${isStart && rangeEnd && rangeStart !== rangeEnd ? 'rounded-l-full' : ''} ${
                isEnd && rangeStart && rangeStart !== rangeEnd ? 'rounded-r-full' : ''
              } ${(!rangeEnd || rangeStart === rangeEnd) && edge ? 'rounded-full' : ''}`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

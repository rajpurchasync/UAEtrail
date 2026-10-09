import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { explorePath, todayIso } from '../../explore';
import { usePlanCalendarData } from '../../hooks/usePlanCalendarData';
import { planLensPath } from '../../plan/planLens';
import type { PlanCalendarDayDetail } from '../../plan/planCalendarMarkers';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../mobile/ConsumerFeedback';
import { PlanIndicatorMonthCalendar } from './PlanIndicatorMonthCalendar';

const LEGEND = [
  { className: 'bg-emerald-500', label: 'You’re available' },
  { className: 'bg-amber-500', label: 'You’re hosting' },
  { className: 'bg-sky-500', label: 'Joined' },
  { className: 'bg-sky-300', label: 'Requested' },
  { className: 'bg-violet-400', label: 'Outings on the map' },
] as const;

const detailLabel = (row: PlanCalendarDayDetail): string => {
  switch (row.kind) {
    case 'available':
      return 'Available for buddies';
    case 'hosting':
      return `Hosting · ${row.title}`;
    case 'joined':
      return `Joined · ${row.title}`;
    case 'requested':
      return `Requested · ${row.title}`;
    case 'outing':
      return row.title;
    default:
      return '';
  }
};

const detailHref = (row: PlanCalendarDayDetail): string | null => {
  if (row.kind === 'available') return planLensPath('availability');
  if (
    row.kind === 'hosting' ||
    row.kind === 'joined' ||
    row.kind === 'requested' ||
    row.kind === 'outing'
  ) {
    return row.href;
  }
  return null;
};

type PlanCalendarSectionProps = {
  refreshKey?: number;
  canHost: boolean;
};

export const PlanCalendarSection = ({ refreshKey = 0, canHost }: PlanCalendarSectionProps) => {
  const { loading, error, markers, details } = usePlanCalendarData(true, canHost, refreshKey);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayIso());

  const dayRows = useMemo(
    () => (selectedDate ? details.get(selectedDate) ?? [] : []),
    [details, selectedDate]
  );

  const outingCount = selectedDate ? markers.get(selectedDate)?.outings ?? 0 : 0;
  const listedOutings = dayRows.filter((r) => r.kind === 'outing').length;
  const extraOutings = outingCount > listedOutings ? outingCount - listedOutings : 0;

  const selectedLabel = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ConsumerLoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ConsumerErrorCard message={error} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">
        Your month — availability, plans you’re in, and what’s on the map.
      </p>

      <PlanIndicatorMonthCalendar
        markersByDay={markers}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-600">
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${item.className}`} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>

      {selectedDate ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold text-neutral-900">{selectedLabel}</h2>
            <Link
              to={explorePath({ date: selectedDate })}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              See map for this day
            </Link>
          </div>

          {dayRows.length === 0 ? (
            <ConsumerInlineEmpty message="Nothing marked on this day yet." />
          ) : (
            <ul className="space-y-2">
              {dayRows.map((row, index) => {
                const href = detailHref(row);
                const label = detailLabel(row);
                if (!href) {
                  return (
                    <li key={`${row.kind}-${index}`} className="text-sm text-neutral-800">
                      {label}
                    </li>
                  );
                }
                return (
                  <li key={`${row.kind}-${index}`}>
                    <Link
                      to={href}
                      className="block rounded-xl bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
              {extraOutings > 0 ? (
                <li>
                  <Link
                    to={explorePath({ date: selectedDate })}
                    className="block rounded-xl border border-dashed border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                  >
                    +{extraOutings} more outing{extraOutings === 1 ? '' : 's'} on the map
                  </Link>
                </li>
              ) : null}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
};

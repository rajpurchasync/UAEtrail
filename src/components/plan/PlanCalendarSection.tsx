import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlanJoinedPeekSheet } from './PlanJoinedPeekSheet';
import { todayIso } from '../../explore';
import { usePlanCalendarData } from '../../hooks/usePlanCalendarData';
import { planLensPath } from '../../plan/planLens';
import type { PlanCalendarDayDetail } from '../../plan/planCalendarMarkers';
import type { PlanCommitmentFilter } from '../../plan/planTab';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../mobile/ConsumerFeedback';
import { PlanIndicatorMonthCalendar } from './PlanIndicatorMonthCalendar';

const legendForFilter = (filter: PlanCommitmentFilter) => {
  if (filter === 'hosting') {
    return [
      { className: 'bg-emerald-500', label: 'You’re available' },
      { className: 'bg-amber-500', label: 'Organizing' },
      { className: 'bg-violet-500', label: 'Looking for company' },
    ];
  }
  return [
    { className: 'bg-sky-500', label: 'Going' },
    { className: 'bg-sky-300', label: 'Pending' },
  ];
};

const detailLabel = (row: PlanCalendarDayDetail): string => {
  switch (row.kind) {
    case 'available':
      return 'Available for buddies';
    case 'hosting':
      return `Organizing · ${row.title}`;
    case 'seeking':
      return `Looking for company · ${row.title}`;
    case 'joined':
      return `Going · ${row.title}`;
    case 'requested':
      return `Pending · ${row.title}`;
    default:
      return '';
  }
};

const isJoinedPeekRow = (
  row: PlanCalendarDayDetail
): row is Extract<PlanCalendarDayDetail, { kind: 'joined' | 'requested' }> =>
  row.kind === 'joined' || row.kind === 'requested';

const detailHref = (row: PlanCalendarDayDetail): string | null => {
  if (row.kind === 'available') return planLensPath('availability');
  if (isJoinedPeekRow(row)) return null;
  if (row.kind === 'hosting' || row.kind === 'seeking') return row.href;
  return null;
};

type PlanCalendarSectionProps = {
  refreshKey?: number;
  canHost: boolean;
  filter: PlanCommitmentFilter;
};

export const PlanCalendarSection = ({
  refreshKey = 0,
  canHost,
  filter,
}: PlanCalendarSectionProps) => {
  const { loading, error, markers, details } = usePlanCalendarData(
    true,
    canHost,
    filter,
    refreshKey
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(todayIso());
  const [peek, setPeek] = useState<{
    activityId: string;
    title: string;
    whenLine: string;
    locationLine: string;
  } | null>(null);

  const dayRows = useMemo(
    () => (selectedDate ? details.get(selectedDate) ?? [] : []),
    [details, selectedDate]
  );

  const selectedLabel = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const legend = legendForFilter(filter);

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
        {filter === 'hosting'
          ? 'Your month — when you’re hosting or looking for company.'
          : 'Your month — outings you’re joining or waiting on.'}
      </p>

      <PlanIndicatorMonthCalendar
        markersByDay={markers}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-600">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${item.className}`} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>

      {selectedDate ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-neutral-900">{selectedLabel}</h2>

          {dayRows.length === 0 ? (
            <ConsumerInlineEmpty message="Nothing on this day for this filter." />
          ) : (
            <ul className="space-y-2">
              {dayRows.map((row, index) => {
                const href = detailHref(row);
                const label = detailLabel(row);
                if (isJoinedPeekRow(row)) {
                  return (
                    <li key={`${row.kind}-${row.activityId}`}>
                      <button
                        type="button"
                        onClick={() =>
                          setPeek({
                            activityId: row.activityId,
                            title: row.title,
                            whenLine: row.whenLine,
                            locationLine: row.locationLine,
                          })
                        }
                        className="block w-full rounded-xl bg-neutral-50 px-3 py-2.5 text-left text-sm font-medium text-neutral-900 active:bg-neutral-100"
                      >
                        {label}
                      </button>
                    </li>
                  );
                }
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
                      className="block rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-medium text-neutral-900 active:bg-neutral-100"
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      <PlanJoinedPeekSheet
        open={Boolean(peek)}
        activityId={peek?.activityId ?? null}
        title={peek?.title ?? ''}
        whenLine={peek?.whenLine}
        locationLine={peek?.locationLine}
        onClose={() => setPeek(null)}
      />
    </div>
  );
};

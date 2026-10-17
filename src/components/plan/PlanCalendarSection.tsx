import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PlanJoinedPeekSheet } from './PlanJoinedPeekSheet';
import { todayIso } from '../../explore';
import { usePlanCalendarData } from '../../hooks/usePlanCalendarData';
import { planAvailabilityPath } from '../../plan/planRouting';
import type { PlanCalendarDayDetail } from '../../plan/planCalendarMarkers';
import { resolvePlanCalendarRowOpenAction } from '../../plan/planCalendarOpen';
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
      return 'Available';
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

const rowButtonClass =
  'flex w-full items-center justify-between gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 text-left text-sm font-medium text-neutral-900 active:bg-neutral-100';

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
  const navigate = useNavigate();
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

  const openRow = (row: PlanCalendarDayDetail) => {
    const action = resolvePlanCalendarRowOpenAction(row);
    if (action.type === 'joined_peek' && (row.kind === 'joined' || row.kind === 'requested')) {
      setPeek({
        activityId: row.activityId,
        title: row.title,
        whenLine: row.whenLine,
        locationLine: row.locationLine,
      });
      return;
    }
    if (action.type === 'navigate') {
      navigate(action.href);
    }
  };

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
        Month at a glance — tap a day, then an outing to open it. Hosting rows open your manage
        list; going / pending open the outing.
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

      <Link
        to={planAvailabilityPath()}
        className="inline-flex text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
      >
        Edit when you&apos;re available
      </Link>

      {selectedDate ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-neutral-900">{selectedLabel}</h2>

          {dayRows.length === 0 ? (
            <ConsumerInlineEmpty message="Nothing on this day for this filter." />
          ) : (
            <ul className="space-y-2">
              {dayRows.map((row, index) => {
                const label = detailLabel(row);
                const action = resolvePlanCalendarRowOpenAction(row);

                if (action.type === 'indicator') {
                  return (
                    <li key={`${row.kind}-${index}`}>
                      <div
                        className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-900"
                        role="status"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                        {label}
                        <span className="text-xs font-normal text-emerald-800/80">Find crew</span>
                      </div>
                    </li>
                  );
                }

                if (action.type === 'none') {
                  return (
                    <li key={`${row.kind}-${index}`} className="text-sm text-neutral-800">
                      {label}
                    </li>
                  );
                }

                const rowKey =
                  row.kind === 'joined' || row.kind === 'requested'
                    ? `${row.kind}-${row.activityId}`
                    : row.kind === 'hosting'
                      ? `hosting-${row.activityId}`
                      : `${row.kind}-${row.intentId ?? row.activityId ?? index}`;

                return (
                  <li key={rowKey}>
                    <button
                      type="button"
                      onClick={() => openRow(row)}
                      className={rowButtonClass}
                    >
                      <span>{label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                    </button>
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

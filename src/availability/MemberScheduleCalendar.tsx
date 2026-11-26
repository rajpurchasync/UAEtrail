import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { planUpcomingEntityLinkState } from '@/discovery/discoveryPortExploreRouting';
import {
  capturePlanUpcomingViewReturn,
  planUpcomingActivityFocusId,
} from '../plan/planUpcomingReturnCapture';
import { viewReturnPathKey } from '../utils/viewReturnMemory';
import { todayIso } from '../explore';
import { usePlanCalendarData } from '../hooks/usePlanCalendarData';
import { planAvailabilityPath } from '../plan/planRouting';
import type { PlanCalendarDayDetail } from '../plan/planCalendarMarkers';
import { resolvePlanCalendarRowOpenAction } from '../plan/planCalendarOpen';
import type { PlanCalendarScope } from '../plan/planTab';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../components/mobile/ConsumerFeedback';
import { PlanIndicatorMonthCalendar } from '../components/plan/PlanIndicatorMonthCalendar';

const legendForScope = (scope: PlanCalendarScope) => {
  if (scope === 'all') {
    return [
      { className: 'bg-emerald-500', label: 'Available' },
      { className: 'bg-teal-600', label: 'Guide blocks' },
      { className: 'bg-amber-500', label: 'Hosting' },
      { className: 'bg-violet-500', label: 'On the map' },
      { className: 'bg-sky-500', label: 'Joined' },
      { className: 'bg-sky-300', label: 'Pending' },
    ];
  }
  if (scope === 'hosting') {
    return [
      { className: 'bg-emerald-500', label: 'Available' },
      { className: 'bg-teal-600', label: 'Guide blocks' },
      { className: 'bg-amber-500', label: 'Hosting' },
      { className: 'bg-violet-500', label: 'On the map' },
    ];
  }
  return [
    { className: 'bg-sky-500', label: 'Joined' },
    { className: 'bg-sky-300', label: 'Pending' },
  ];
};

const detailLabel = (row: PlanCalendarDayDetail): string => {
  switch (row.kind) {
    case 'block': {
      const cap = row.capacity === 'guide' ? 'Guide' : 'Available';
      if (row.scheduleKind === 'fixed') {
        return `${cap} · On the map · ${row.title ?? 'Slot'}`;
      }
      return `${cap} · ${row.modalitiesLabel}`;
    }
    case 'available':
      return 'Available';
    case 'hosting':
      return `Hosting · ${row.title}`;
    case 'mapSlot':
      return `On the map · ${row.title}`;
    case 'joined':
      return `Joined · ${row.title}`;
    case 'requested':
      return `Pending · ${row.title}`;
    default:
      return '';
  }
};

const rowButtonClass =
  'flex w-full items-center justify-between gap-2 rounded-2xl bg-neutral-50 px-3 py-2.5 text-left text-sm font-medium text-neutral-900 active:bg-neutral-100';

export type MemberScheduleCalendarProps = {
  refreshKey?: number;
  canHost: boolean;
  scope: PlanCalendarScope;
  introCopy?: string;
};

/** Unified busy + availability calendar (Plan · Profile · Operator entry — MIG-SG-B3). */
export const MemberScheduleCalendar = ({
  refreshKey = 0,
  canHost,
  scope,
  introCopy = 'Month at a glance — busy outings and availability blocks. Tap a row to open or edit.',
}: MemberScheduleCalendarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, markers, details } = usePlanCalendarData(
    true,
    canHost,
    scope,
    refreshKey
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(todayIso());
  const calendarRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLElement>(null);
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

  const legend = legendForScope(scope);

  useEffect(() => {
    const events = eventsRef.current;
    const calendar = calendarRef.current;
    if (!selectedDate || !events || !calendar) return;
    const scroller = calendar.closest('.app-scroll-body');
    if (!(scroller instanceof HTMLElement)) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const eventsRect = events.getBoundingClientRect();
    const hiddenBelow = eventsRect.bottom - scrollerRect.bottom;
    if (hiddenBelow <= 12) return;
    const roomBeforeCalendarClips = calendar.getBoundingClientRect().top - scrollerRect.top;
    const delta = Math.min(hiddenBelow + 16, Math.max(0, roomBeforeCalendarClips));
    if (delta > 0) scroller.scrollBy({ top: delta, behavior: 'smooth' });
  }, [selectedDate, dayRows.length]);

  const openRow = (row: PlanCalendarDayDetail) => {
    const action = resolvePlanCalendarRowOpenAction(row);
    if (action.type === 'navigate') {
      if (action.href.startsWith('/activity/')) {
        const returnTo = viewReturnPathKey(location.pathname, location.search);
        capturePlanUpcomingViewReturn(location.pathname, location.search);
        navigate(action.href, { state: planUpcomingEntityLinkState(returnTo) });
        return;
      }
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
      <p className="text-sm text-neutral-600">{introCopy}</p>

      <div ref={calendarRef}>
        <PlanIndicatorMonthCalendar
          markersByDay={markers}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

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
        <section ref={eventsRef} className="rounded-2xl border border-neutral-200 bg-white p-4">
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
                  row.kind === 'block'
                    ? `block-${row.scheduleKind}-${row.capacity}-${index}`
                    : row.kind === 'joined' || row.kind === 'requested'
                      ? `${row.kind}-${row.activityId}`
                      : row.kind === 'hosting'
                        ? `hosting-${row.activityId}`
                        : row.kind === 'mapSlot'
                          ? `crew-${row.slotId ?? index}`
                          : `available-${index}`;

                return (
                  <li key={rowKey}>
                    <button
                      type="button"
                      data-nav-focus={
                        'activityId' in row && row.activityId
                          ? planUpcomingActivityFocusId(row.activityId)
                          : rowKey
                      }
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
    </div>
  );
};
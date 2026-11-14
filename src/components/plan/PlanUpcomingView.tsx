import { useState } from 'react';
import { CalendarDays, List, Search } from 'lucide-react';
import type { PlanCommitmentFilter, PlanUpcomingLayout } from '../../plan/planTab';
import { PRODUCT_PLAN_UPCOMING_JOINED_CONTEXT } from '../../content/productNorthStar';
import { PlanAvailabilitySection } from './PlanAvailabilitySection';
import { PlanCalendarSection } from './PlanCalendarSection';
import { PlanJoinedUpcoming } from './PlanJoinedUpcoming';
import { PlanNeedsYouStrip } from './PlanNeedsYouStrip';
import { parsePlanLens } from '../../plan/planLens';
import { PLAN_SUMMARY_FOCUS_ELEMENT_IDS } from '../../plan/planSummaryFocusScroll';

const PLAN_SUMMARY_SCROLL_MT = 'scroll-mt-[calc(var(--safe-top)+7.5rem)] outline-none';

type PlanUpcomingViewProps = {
  refreshKey: number;
  canHost: boolean;
  filter: PlanCommitmentFilter;
  layout: PlanUpcomingLayout;
  lensRaw: string | null;
  onLayoutChange: (layout: PlanUpcomingLayout) => void;
};

/** My Plans → Upcoming tab (joined + calendar + availability). Hosting lives at `/hosting`. */
export const PlanUpcomingView = ({
  refreshKey,
  canHost,
  filter,
  layout,
  lensRaw,
  onLayoutChange,
}: PlanUpcomingViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const planLens = parsePlanLens(lensRaw);
  const listSections = planLens !== 'availability' && layout === 'list';
  const searchPlaceholder = 'Search joined outings…';

  const upcomingBody =
    planLens === 'availability' ? (
      <PlanAvailabilitySection />
    ) : layout === 'calendar' ? (
      <PlanCalendarSection refreshKey={refreshKey} canHost={canHost} filter={filter} />
    ) : (
      <PlanJoinedUpcoming refreshKey={refreshKey} searchQuery={searchQuery} />
    );

  return (
    <div className="space-y-3 md:space-y-2">
      {planLens !== 'availability' && layout === 'list' ? (
        <p className="text-xs leading-snug text-neutral-500 md:text-[11px]">
          {PRODUCT_PLAN_UPCOMING_JOINED_CONTEXT}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        {planLens !== 'availability' ? (
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder.replace('…', '')}
              className="w-full rounded-xl border border-neutral-200/80 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 shadow-sm outline-none ring-emerald-600/30 placeholder:text-neutral-400 focus:ring-2"
            />
          </div>
        ) : null}
        <div className="flex shrink-0 rounded-xl border border-neutral-200/80 bg-white p-0.5 ms-auto">
          <button
            type="button"
            aria-label="List view"
            aria-pressed={layout === 'list'}
            onClick={() => onLayoutChange('list')}
            className={`rounded-lg p-2.5 ${layout === 'list' ? 'bg-emerald-700 text-white' : 'text-neutral-500'}`}
          >
            <List className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Calendar view"
            aria-pressed={layout === 'calendar'}
            onClick={() => onLayoutChange('calendar')}
            className={`rounded-lg p-2.5 ${layout === 'calendar' ? 'bg-emerald-700 text-white' : 'text-neutral-500'}`}
          >
            <CalendarDays className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <PlanNeedsYouStrip refreshKey={refreshKey} />

      {listSections && filter === 'joined' ? (
        <section
          id={PLAN_SUMMARY_FOCUS_ELEMENT_IDS.joined}
          tabIndex={-1}
          className={PLAN_SUMMARY_SCROLL_MT}
          aria-label="Joined"
        >
          {upcomingBody}
        </section>
      ) : (
        upcomingBody
      )}
    </div>
  );
};
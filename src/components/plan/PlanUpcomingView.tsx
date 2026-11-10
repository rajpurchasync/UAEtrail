import { CalendarDays, List } from 'lucide-react';
import type { PlanCommitmentFilter, PlanUpcomingLayout } from '../../plan/planTab';
import {
  PRODUCT_PLAN_UPCOMING_HOSTING_CONTEXT,
  PRODUCT_PLAN_UPCOMING_JOINED_CONTEXT,
} from '../../content/productNorthStar';
import { PlanAvailabilitySection } from './PlanAvailabilitySection';
import { PlanCalendarSection } from './PlanCalendarSection';
import { PlanHostingUpcoming } from './PlanHostingUpcoming';
import { PlanJoinedUpcoming } from './PlanJoinedUpcoming';
import { PlanNeedsYouStrip } from './PlanNeedsYouStrip';
import { parsePlanLens } from '../../plan/planLens';
import { PlanHostingManageProvider } from '../../plan/PlanHostingManageContext';
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

export const PlanUpcomingView = ({
  refreshKey,
  canHost,
  filter,
  layout,
  lensRaw,
  onLayoutChange,
}: PlanUpcomingViewProps) => {
  const planLens = parsePlanLens(lensRaw);
  const hostingActive = canHost && filter === 'hosting';
  const listSections = planLens !== 'availability' && layout === 'list';

  const upcomingBody =
    planLens === 'availability' ? (
      <PlanAvailabilitySection />
    ) : layout === 'calendar' ? (
      <PlanCalendarSection refreshKey={refreshKey} canHost={canHost} filter={filter} />
    ) : filter === 'hosting' ? (
      <PlanHostingUpcoming refreshKey={refreshKey} canHost={canHost} />
    ) : (
      <PlanJoinedUpcoming refreshKey={refreshKey} />
    );

  return (
    <div className="space-y-3 md:space-y-2">
      {planLens !== 'availability' && layout === 'list' ? (
        <p className="text-xs leading-snug text-neutral-500 md:text-[11px]">
          {filter === 'hosting' && canHost
            ? PRODUCT_PLAN_UPCOMING_HOSTING_CONTEXT
            : PRODUCT_PLAN_UPCOMING_JOINED_CONTEXT}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-3">
        <div className="flex shrink-0 rounded-xl border border-neutral-200/80 bg-white p-0.5">
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

      <PlanHostingManageProvider refreshKey={refreshKey} canHost={canHost} active={hostingActive}>
        {listSections && filter === 'hosting' ? (
          <section
            id={PLAN_SUMMARY_FOCUS_ELEMENT_IDS.hosting}
            tabIndex={-1}
            className={PLAN_SUMMARY_SCROLL_MT}
            aria-label="Hosting"
          >
            {upcomingBody}
          </section>
        ) : listSections && filter === 'joined' ? (
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
      </PlanHostingManageProvider>
    </div>
  );
};

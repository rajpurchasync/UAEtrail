import { CalendarDays, List } from 'lucide-react';
import type { PlanCommitmentFilter, PlanUpcomingLayout } from '../../plan/planTab';
import { PlanAvailabilitySection } from './PlanAvailabilitySection';
import { PlanCalendarSection } from './PlanCalendarSection';
import { PlanCommitmentFilterChips } from './PlanCommitmentFilter';
import { PlanHostingUpcoming } from './PlanHostingUpcoming';
import { PlanJoinedUpcoming } from './PlanJoinedUpcoming';
import { PlanNeedsYouStrip } from './PlanNeedsYouStrip';
import { parsePlanLens } from '../../plan/planLens';

type PlanUpcomingViewProps = {
  refreshKey: number;
  canHost: boolean;
  filter: PlanCommitmentFilter;
  layout: PlanUpcomingLayout;
  lensRaw: string | null;
  onFilterChange: (filter: PlanCommitmentFilter) => void;
  onLayoutChange: (layout: PlanUpcomingLayout) => void;
};

export const PlanUpcomingView = ({
  refreshKey,
  canHost,
  filter,
  layout,
  lensRaw,
  onFilterChange,
  onLayoutChange,
}: PlanUpcomingViewProps) => {
  const legacyLens = parsePlanLens(lensRaw);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <PlanCommitmentFilterChips
          value={filter}
          onChange={onFilterChange}
          showHosting={canHost}
        />
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

      {legacyLens === 'availability' ? (
        <PlanAvailabilitySection />
      ) : layout === 'calendar' ? (
        <PlanCalendarSection refreshKey={refreshKey} canHost={canHost} filter={filter} />
      ) : filter === 'hosting' ? (
        <PlanHostingUpcoming refreshKey={refreshKey} canHost={canHost} />
      ) : (
        <PlanJoinedUpcoming refreshKey={refreshKey} />
      )}
    </div>
  );
};

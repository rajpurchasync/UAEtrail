import { useMemo } from 'react';
import type { ExploreActivityDatePreset } from '@/discovery/discoveryPortExploreActivityDate';
import {
  ExploreSearchBookingHero,
  resolveExploreSearchDetectedWhereQuery,
} from '@/discovery/discoveryPortExploreSearch';
import type { BrowseListFilterState } from '@/discovery/discoveryPortListFilters';
import { FIND_CREW_WHERE_PLACEHOLDER, FIND_CREW_WHEN_PICK_LABEL } from './findCrewSearchCopy';

type FindCrewSearchChromeProps = {
  query: string;
  committedQuery: string;
  onQueryChange: (value: string) => void;
  onSearchSubmit: () => void;
  filters: BrowseListFilterState;
  regions: string[];
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
};

export const FindCrewSearchChrome = ({
  query,
  committedQuery,
  onQueryChange,
  onSearchSubmit,
  filters,
  regions,
  onActivityDatePresetChange,
  onVenueRegionsChange,
}: FindCrewSearchChromeProps) => {
  const detectedWhere = useMemo(() => resolveExploreSearchDetectedWhereQuery(), []);
  const committedWhere = committedQuery.trim() || detectedWhere;

  return (
    <div className="min-w-0">
      <ExploreSearchBookingHero
        homeScope="crew"
        detectedWhere={detectedWhere}
        committedWhere={committedWhere}
        draftQuery={query}
        onQueryChange={onQueryChange}
        onSubmit={onSearchSubmit}
        activityDatePreset={filters.activityDatePreset}
        onDatePresetChange={onActivityDatePresetChange}
        venueRegions={regions}
        onVenueRegionsChange={onVenueRegionsChange}
        wherePlaceholder={FIND_CREW_WHERE_PLACEHOLDER}
        whenUnsetLabel={FIND_CREW_WHEN_PICK_LABEL}
      />
    </div>
  );
};
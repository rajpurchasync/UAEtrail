import { ChevronLeft } from 'lucide-react';
import { useVenueStateFilterOptions } from '../../config/useVenueStateFilterOptions';
import { mapFilterLabel } from '../../config/exploreMapFilters';
import type { MapFilterKey } from '../routing';
import {
  EXPLORE_COMPACT_PILL_GRID,
  EXPLORE_COMPACT_PILL_LABEL,
  EXPLORE_FILTER_PILL,
  EXPLORE_MAP_FILTER_INACTIVE,
  exploreMapFilterActiveClass,
} from '../../config/exploreTheme';
import { ExploreFilterIcon, type ExploreFilterEmojiContext } from './ExploreFilterIcon';

type Props = {
  venueRegions: string[];
  onVenueRegionsChange: (regions: string[]) => void;
  mapFilter?: MapFilterKey;
  filterEmojiContext?: ExploreFilterEmojiContext;
  onBackToCategoryFilters?: () => void;
};

/** Emirate chips for browse list — stacked cells; optional leading cell = active type (back). */
export const ExploreBrowseListRegionPillsRow = ({
  venueRegions,
  onVenueRegionsChange,
  mapFilter,
  filterEmojiContext = 'activity',
  onBackToCategoryFilters,
}: Props) => {
  const options = useVenueStateFilterOptions();
  const showTypeBack = mapFilter != null && mapFilter !== 'all' && onBackToCategoryFilters != null;
  const columnCount = options.length + (showTypeBack ? 1 : 0);

  const toggle = (key: string) => {
    onVenueRegionsChange(
      venueRegions.includes(key) ? venueRegions.filter((region) => region !== key) : [...venueRegions, key]
    );
  };

  return (
    <div
      className={`min-w-0 w-full ${EXPLORE_COMPACT_PILL_GRID}`}
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {showTypeBack ? (
        <button
          type="button"
          onClick={onBackToCategoryFilters}
          className={`${EXPLORE_FILTER_PILL.listStackedCell} ${exploreMapFilterActiveClass(mapFilter)}`}
          aria-label={`${mapFilterLabel(mapFilter)} filter active — change type`}
        >
          <span className="inline-flex items-center justify-center gap-px leading-none" aria-hidden>
            <ChevronLeft className="h-2.5 w-2.5 shrink-0 opacity-90" strokeWidth={2.75} />
            <ExploreFilterIcon filter={mapFilter} context={filterEmojiContext} className="text-sm leading-none" />
          </span>
          <span className={EXPLORE_COMPACT_PILL_LABEL}>{mapFilterLabel(mapFilter)}</span>
        </button>
      ) : null}
      {options.map((option) => {
        const active = venueRegions.includes(option.key);
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => toggle(option.key)}
            className={`${EXPLORE_FILTER_PILL.listStackedCell} ${
              active ? exploreMapFilterActiveClass('all') : EXPLORE_MAP_FILTER_INACTIVE
            }`}
            aria-pressed={active}
          >
            <span className="text-sm leading-none" aria-hidden>📍</span>
            <span className={EXPLORE_COMPACT_PILL_LABEL}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

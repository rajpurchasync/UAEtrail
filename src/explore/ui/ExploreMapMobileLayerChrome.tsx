import { type ReactElement } from 'react';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';
import {
  aliasListPlaceTopicToMap,
  type ExplorePriceFilter,
  type ExploreVenueFilterPatch,
} from '../exploreOptionalFilters';
import type { BrowseTripTopicKey } from '../../list/browseListTripTopics';
import type { ListVenuePlaceTopicKey } from '../../list/listVenuePlaceTopics';
import { ListExplorerQuickFilters } from '../../list/explorer/ListExplorerQuickFilters';
import { UiTooltip } from '../../components/ui/UiTooltip';
import { EXPLORE_MAP_CHROME_FROST, exploreMapScopeSegmentLabeledClass } from '../../config/exploreTheme';
import { EXPLORE_PLACES_LAYER_EMOJI, SEEKING_EMOJI } from '../exploreCopy';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import { browsePanelForMobileLayer } from './exploreMapMobileMenus';
import {
  exploreMapQuickFiltersBrowseState,
  explorePanelToListExplorerBucket,
} from './exploreMapQuickFiltersState';

const SCOPE_ROW = 'flex h-8 min-w-0 items-center gap-2';
const SCOPE_TRAY =
  `flex h-8 w-auto max-w-[calc(100%-2.25rem)] shrink-0 items-center gap-0.5 overflow-hidden rounded-full p-0.5 ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`;
const CREWS_SCOPE_EMOJI = '👥';

const tip = (label: string, button: ReactElement) => (
  <UiTooltip label={label} className="flex items-center justify-center">
    {button}
  </UiTooltip>
);

type MobileLayer = 'activity' | 'places';

type ExploreMapMobileLayerChromeProps = {
  panel: ExplorePanel;
  mapFilter: MapFilterKey;
  venueRegions: string[];
  activityDatePreset: ExploreActivityDatePreset;
  onBrowsePanelChange: (panel: ExplorePanel) => void;
  onMapFilterChange: (filter: MapFilterKey) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  venueFilter?: VenueListFilterKey;
  tripMapTopics: TripMapTopicKey[];
  placeMapTopics: PlaceMapTopicKey[];
  priceFilter: ExplorePriceFilter;
  hasTrip: boolean;
  facilityKinds: PlaceKind[];
  onTripTopicsChange: (next: TripMapTopicKey[]) => void;
  onPlaceTopicsChange: (next: PlaceMapTopicKey[]) => void;
  onPriceFilterChange: (next: ExplorePriceFilter) => void;
  onHasTripChange: (next: boolean) => void;
  onFacilityKindsChange: (next: PlaceKind[]) => void;
  onVenueFiltersChange: (next: ExploreVenueFilterPatch) => void;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  searchScopeCounts?: ExploreSearchScopeCounts;
  onOpenExploreSearch?: () => void;
  /** Crews tab — full-screen people list (`/list?listCat=people`), not map scope. */
  onOpenCrewsPage: () => void;
};

export const ExploreMapMobileLayerChrome = ({
  panel,
  mapFilter,
  venueRegions,
  activityDatePreset,
  onBrowsePanelChange,
  onMapFilterChange,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  tripMapTopics,
  placeMapTopics,
  priceFilter,
  hasTrip,
  facilityKinds,
  onTripTopicsChange,
  onPlaceTopicsChange,
  onPriceFilterChange,
  onHasTripChange,
  onFacilityKindsChange,
  onVenueFiltersChange,
  onOpenExploreSearch,
  onOpenCrewsPage,
}: ExploreMapMobileLayerChromeProps) => {
  const layer: MobileLayer = panel === 'venues' || panel === 'shops' ? 'places' : 'activity';

  const openLayer = (next: MobileLayer) => {
    onBrowsePanelChange(browsePanelForMobileLayer(next));
    if (next === 'places' && mapFilter === 'rideshare') onMapFilterChange('all');
    if (next === 'activity' && (mapFilter === 'shops' || mapFilter === 'facilities')) {
      onMapFilterChange('all');
    }
  };

  const filters = exploreMapQuickFiltersBrowseState({
    tripMapTopics,
    placeMapTopics,
    priceFilter,
    hasTrip,
    facilityKinds,
    activityDatePreset,
  });

  const commitListPlaceTopics = (next: ListVenuePlaceTopicKey[]) => {
    const mapped = next
      .map(aliasListPlaceTopicToMap)
      .filter((key): key is PlaceMapTopicKey => key != null);
    onPlaceTopicsChange(mapped);
  };

  const commitListVenueFilters = (next: {
    placeTopics: ListVenuePlaceTopicKey[];
    facilityKinds: PlaceKind[];
  }) => {
    const mappedTopics = next.placeTopics
      .map(aliasListPlaceTopicToMap)
      .filter((key): key is PlaceMapTopicKey => key != null);
    onVenueFiltersChange({ placeTopics: mappedTopics, facilityKinds: next.facilityKinds });
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2">
      <div className={SCOPE_ROW}>
        <div className={SCOPE_TRAY} role="tablist" aria-label="Trips, venues, and crews">
          <button
            type="button"
            role="tab"
            className={exploreMapScopeSegmentLabeledClass(layer === 'activity', 'activity')}
            aria-selected={layer === 'activity'}
            onClick={() => openLayer('activity')}
          >
            <span className="font-emoji shrink-0 text-base leading-none" aria-hidden>
              {SEEKING_EMOJI}
            </span>
            <span className="whitespace-nowrap">Trips</span>
          </button>
          <button
            type="button"
            role="tab"
            className={exploreMapScopeSegmentLabeledClass(layer === 'places', 'places')}
            aria-selected={layer === 'places'}
            onClick={() => openLayer('places')}
          >
            <span className="font-emoji shrink-0 text-base leading-none" aria-hidden>
              {EXPLORE_PLACES_LAYER_EMOJI}
            </span>
            <span className="whitespace-nowrap">Venues</span>
          </button>
          <button
            type="button"
            role="tab"
            className={exploreMapScopeSegmentLabeledClass(false, 'activity')}
            aria-selected={false}
            aria-label="Crews"
            onClick={() => onOpenCrewsPage()}
          >
            <span className="font-emoji shrink-0 text-base leading-none" aria-hidden>
              {CREWS_SCOPE_EMOJI}
            </span>
            <span className="whitespace-nowrap">Crews</span>
          </button>
        </div>
        {onOpenExploreSearch ? (
          <div className="ml-auto shrink-0">
            {tip(
              'Search',
              <button
                type="button"
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`}
                aria-label="Search explore"
                onClick={() => onOpenExploreSearch()}
              >
                <span className="font-emoji text-[0.9375rem]" aria-hidden>
                  🔍
                </span>
              </button>
            )}
          </div>
        ) : null}
      </div>

      <ListExplorerQuickFilters
        bucket={explorePanelToListExplorerBucket(panel)}
        filters={filters}
        regions={venueRegions}
        onTripTopicsChange={(next: BrowseTripTopicKey[]) => onTripTopicsChange(next)}
        onPlaceTopicsChange={commitListPlaceTopics}
        onPriceChange={onPriceFilterChange}
        onHasTripChange={onHasTripChange}
        onFacilityKindsChange={onFacilityKindsChange}
        onVenueFiltersChange={commitListVenueFilters}
        onActivityDatePresetChange={onActivityDatePresetChange}
        onVenueRegionsChange={onVenueRegionsChange}
      />
    </div>
  );
};

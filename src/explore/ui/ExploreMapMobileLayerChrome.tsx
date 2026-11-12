import type { PlaceKind } from '@uaetrail/shared-types';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { UiTooltip } from '../../components/ui/UiTooltip';
import { EXPLORE_MAP_CHROME_FROST, exploreMapScopeSegmentClass } from '../../config/exploreTheme';
import { EXPLORE_PLACES_LAYER_EMOJI, SEEKING_EMOJI } from '../exploreCopy';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import {
  effectivePlaceMapTopics,
  effectiveTripMapTopics,
  type PlaceMapTopicKey,
  type TripMapTopicKey,
} from '../exploreMapQuickTopicFilters';
import { browsePanelForMobileLayer } from './exploreMapMobileMenus';
import type { ExplorePriceFilter, ExploreVenueFilterPatch } from '../exploreOptionalFilters';
import { ExploreOptionalFilterRow } from './ExploreOptionalFilterRow';

type MobileLayer = 'activity' | 'places';

type ExploreMapMobileLayerChromeProps = {
  panel: ExplorePanel;
  mapFilter: MapFilterKey;
  venueRegions: string[];
  activityDatePreset: ExploreActivityDatePreset;
  tripMapTopics?: TripMapTopicKey[];
  placeMapTopics?: PlaceMapTopicKey[];
  priceFilter?: ExplorePriceFilter;
  hasTrip?: boolean;
  facilityKinds?: PlaceKind[];
  onBrowsePanelChange: (panel: ExplorePanel) => void;
  onMapFilterChange: (filter: MapFilterKey) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  onTripTopicsChange?: (next: TripMapTopicKey[]) => void;
  onPlaceTopicsChange?: (next: PlaceMapTopicKey[]) => void;
  onPriceFilterChange?: (next: ExplorePriceFilter) => void;
  onHasTripChange?: (next: boolean) => void;
  onFacilityKindsChange?: (next: PlaceKind[]) => void;
  onVenueFiltersChange?: (next: ExploreVenueFilterPatch) => void;
  venueFilter?: VenueListFilterKey;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  searchScopeCounts?: ExploreSearchScopeCounts;
  onOpenExploreSearch?: () => void;
};

export const ExploreMapMobileLayerChrome = ({
  panel,
  mapFilter,
  venueRegions,
  activityDatePreset,
  tripMapTopics = [],
  placeMapTopics = [],
  priceFilter = 'all',
  hasTrip = false,
  facilityKinds = [],
  onBrowsePanelChange,
  onMapFilterChange,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  onTripTopicsChange,
  onPlaceTopicsChange,
  onPriceFilterChange,
  onHasTripChange,
  onFacilityKindsChange,
  onVenueFiltersChange,
  venueFilter = 'all',
  onOpenExploreSearch,
}: ExploreMapMobileLayerChromeProps) => {
  const onPlaces = panel === 'venues' || panel === 'shops';
  const layer: MobileLayer = onPlaces ? 'places' : 'activity';
  const activeTripTopics = effectiveTripMapTopics(mapFilter, tripMapTopics);
  const activePlaceTopics = effectivePlaceMapTopics(mapFilter, venueFilter, placeMapTopics);

  const openLayer = (next: MobileLayer) => {
    onBrowsePanelChange(browsePanelForMobileLayer(next));
    if (next === 'places' && mapFilter === 'rideshare') onMapFilterChange('all');
    if (next === 'activity' && (mapFilter === 'shops' || mapFilter === 'facilities')) {
      onMapFilterChange('all');
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch">
      <div className="flex flex-col gap-0 overflow-visible">
      <div className="flex h-10 w-full min-w-0 items-center justify-between gap-2 px-0.5">
        <div
          className={`inline-flex h-10 w-[min(100%,13.5rem)] shrink-0 items-center gap-0.5 rounded-full p-0.5 ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`}
          role="tablist"
          aria-label="Map layer"
        >
          <button
            type="button"
            role="tab"
            className={`${exploreMapScopeSegmentClass(layer === 'activity', 'activity')} h-full min-w-0 flex-1 !justify-center !gap-1 !px-1.5 !py-0 !text-xs`}
            aria-selected={layer === 'activity'}
            onClick={() => openLayer('activity')}
          >
            <span className="font-emoji shrink-0 text-base leading-none" aria-hidden>
              {SEEKING_EMOJI}
            </span>
            <span className="shrink-0 whitespace-nowrap">Trips</span>
          </button>
          <button
            type="button"
            role="tab"
            className={`${exploreMapScopeSegmentClass(layer === 'places', 'places')} h-full min-w-0 flex-1 !justify-center !gap-1 !px-1.5 !py-0 !text-xs`}
            aria-selected={layer === 'places'}
            onClick={() => openLayer('places')}
          >
            <span className="font-emoji shrink-0 text-base leading-none" aria-hidden>
              {EXPLORE_PLACES_LAYER_EMOJI}
            </span>
            <span className="shrink-0 whitespace-nowrap">Venues</span>
          </button>
        </div>
        {onOpenExploreSearch ? (
          <UiTooltip label="Search" className="flex shrink-0 md:hidden">
            <button
              type="button"
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`}
              aria-label="Search explore"
              onClick={() => onOpenExploreSearch()}
            >
              <span className="font-emoji" aria-hidden>
                🔍
              </span>
            </button>
          </UiTooltip>
        ) : null}
      </div>

      <div key={layer} className="explore-map-filter-quote-swap mt-1.5 max-lg:mt-3.5">
        <ExploreOptionalFilterRow
          layer={layer}
          activityDatePreset={activityDatePreset}
          onActivityDatePresetChange={onActivityDatePresetChange}
          tripTopics={activeTripTopics}
          onTripTopicsChange={(next) => onTripTopicsChange?.(next)}
          placeTopics={activePlaceTopics}
          onPlaceTopicsChange={(next) => onPlaceTopicsChange?.(next)}
          price={priceFilter}
          onPriceChange={(next) => onPriceFilterChange?.(next)}
          regions={venueRegions}
          onRegionsChange={onVenueRegionsChange}
          hasTrip={hasTrip}
          onHasTripChange={(next) => onHasTripChange?.(next)}
          facilityKinds={facilityKinds}
          onFacilityKindsChange={(next) => onFacilityKindsChange?.(next)}
          onVenueFiltersChange={onVenueFiltersChange}
        />
      </div>
      </div>
    </div>
  );
};

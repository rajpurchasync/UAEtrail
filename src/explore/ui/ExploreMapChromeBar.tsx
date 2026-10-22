import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import { EXPLORE_MOBILE_MAP_CHROME, EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreMapDateFilter } from './ExploreMapDateFilter';
import { VenueStateFilterMenu } from './VenueStateFilterMenu';
import { ExploreMapPeopleBrowseButton } from '@/people-discovery/panel/ExploreMapPeopleBrowseButton';
import { ExploreMapMobileLayerChrome } from './ExploreMapMobileLayerChrome';
import { EXPLORE_FLOATING_CONTROL } from '../../config/exploreTheme';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';

type ExploreMapChromeBarProps = {
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  searchScopeCounts?: ExploreSearchScopeCounts;
  panel: ExplorePanel;
  mapFilter: MapFilterKey;
  venueRegions: string[];
  activityDatePreset: ExploreActivityDatePreset;
  onBrowsePanelChange: (panel: ExplorePanel) => void;
  onMapFilterChange: (filter: MapFilterKey) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  venueFilter?: VenueListFilterKey;
  onVenueFilterChange?: (filter: VenueListFilterKey) => void;
  onOpenPeopleBrowsePanel?: () => void;
  peopleBrowsePanelAvatars?: Array<{ id: string; name: string; avatar?: string | null }>;
  peopleBrowsePanelFriendCount?: number;
  onOpenExploreSearch?: () => void;
};

/** Map toolbar — same Activities / Places browse context as the list panel. */
export const ExploreMapChromeBar = ({
  searchQuery = '',
  onSearchQueryChange,
  onSearchCommit,
  searchScopeCounts,
  panel,
  mapFilter,
  venueRegions,
  activityDatePreset,
  onBrowsePanelChange,
  onMapFilterChange,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  venueFilter,
  onVenueFilterChange,
  onOpenPeopleBrowsePanel,
  peopleBrowsePanelAvatars = [],
  peopleBrowsePanelFriendCount = 0,
  onOpenExploreSearch,
}: ExploreMapChromeBarProps) => {
  const onActivitiesBrowse = panel === 'activities';
  const onPlacesBrowse = panel === 'venues' || panel === 'shops';

  return (
  <div
    className={`pointer-events-none absolute inset-x-0 top-0 px-3 pt-2 lg:px-4 lg:pt-3 ${EXPLORE_MOBILE_MAP_CHROME.filterTop} ${EXPLORE_Z.mapFilters}`}
  >
    <div
      className="pointer-events-auto grid w-full grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_auto] items-start gap-x-2 gap-y-3.5 lg:flex lg:justify-end"
    >
      <ExploreMapMobileLayerChrome
        panel={panel}
        mapFilter={mapFilter}
        venueRegions={venueRegions}
        activityDatePreset={activityDatePreset}
        onBrowsePanelChange={onBrowsePanelChange}
        onMapFilterChange={onMapFilterChange}
        onActivityDatePresetChange={onActivityDatePresetChange}
        onVenueRegionsChange={onVenueRegionsChange}
        venueFilter={venueFilter}
        onVenueFilterChange={onVenueFilterChange}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onSearchCommit={onSearchCommit}
        searchScopeCounts={searchScopeCounts}
        onOpenExploreSearch={onOpenExploreSearch}
      />
      {onOpenPeopleBrowsePanel ? (
        <ExploreMapPeopleBrowseButton
          avatars={peopleBrowsePanelAvatars}
          friendCount={peopleBrowsePanelFriendCount}
          onClick={onOpenPeopleBrowsePanel}
          className="col-start-2 row-start-1 shrink-0 justify-self-end lg:hidden"
        />
      ) : null}
      {onOpenPeopleBrowsePanel ? (
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {onActivitiesBrowse ? (
            <ExploreMapDateFilter
              activityDatePreset={activityDatePreset}
              onActivityDatePresetChange={onActivityDatePresetChange}
              includeAnyday={false}
              iconOnly
              iconTriggerClassName={`${EXPLORE_FLOATING_CONTROL} inline-flex h-10 w-10 items-center justify-center text-emerald-950`}
            />
          ) : onPlacesBrowse ? (
            <VenueStateFilterMenu
              selected={venueRegions}
              onChange={onVenueRegionsChange}
              toolbarTrigger
            />
          ) : null}
          <ExploreMapPeopleBrowseButton
            avatars={peopleBrowsePanelAvatars}
            friendCount={peopleBrowsePanelFriendCount}
            onClick={onOpenPeopleBrowsePanel}
            className="shrink-0"
          />
        </div>
      ) : null}
    </div>
  </div>
  );
};

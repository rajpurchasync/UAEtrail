import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import { EXPLORE_MOBILE_MAP_CHROME, EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreMapGoingPanelButton } from './ExploreMapGoingPanelButton';
import { ExploreMapMobileLayerChrome } from './ExploreMapMobileLayerChrome';
import type { ExplorePanel, MapFilterKey } from '../routing';
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
  onOpenGoingPanel?: () => void;
  goingPanelAvatars?: Array<{ id: string; name: string; avatar?: string | null }>;
  goingPanelExtraCount?: number;
  goingPanelTotalJoining?: number;
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
  onOpenGoingPanel,
  goingPanelAvatars = [],
  goingPanelExtraCount = 0,
  goingPanelTotalJoining = 0,
}: ExploreMapChromeBarProps) => (
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
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onSearchCommit={onSearchCommit}
        searchScopeCounts={searchScopeCounts}
      />
      {onOpenGoingPanel ? (
        <ExploreMapGoingPanelButton
          avatars={goingPanelAvatars}
          extraCount={goingPanelExtraCount}
          totalJoining={goingPanelTotalJoining}
          onClick={onOpenGoingPanel}
          className="col-start-2 row-start-1 shrink-0 justify-self-end lg:hidden"
        />
      ) : null}
      {onOpenGoingPanel ? (
        <ExploreMapGoingPanelButton
          avatars={goingPanelAvatars}
          extraCount={goingPanelExtraCount}
          totalJoining={goingPanelTotalJoining}
          onClick={onOpenGoingPanel}
          className="hidden shrink-0 lg:inline-flex"
        />
      ) : null}
    </div>
  </div>
);

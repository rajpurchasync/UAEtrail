import { SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ExploreMapProjectionToggle } from '../../explore/ui/ExploreMapProjectionToggle';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';
import { EXPLORE_CREWS_SEARCH_PLACEHOLDER } from '../../content/exploreCrewsCopy';
import type { CrewBrowseLane, CrewPeopleFacet, CrewProfessionalKind } from '@/crew-discovery/crewBrowseState';
import { DEFAULT_CREW_PEOPLE_FACET } from '@/crew-discovery/crewBrowseState';
import {
  CrewsProfessionalKindChips,
  crewsProfessionalKindClearTarget,
} from '../crews/CrewsProfessionalKindChips';
import { normalizeCrewBrowseLaneForProduct } from '@/crew-discovery/crewBrowseFeatureGates';
import { CrewBrowsePanelTabs } from '@/crew-discovery/panel/CrewBrowsePanelTabs';
import { LIST_CHROME, LIST_HUB_SEARCH_ROW } from '../browse/listChromeTheme';
import { ListDiscoverySearchField } from './ListDiscoverySearchField';
import { CrewsAvailabilityStrip } from '../crews/CrewsAvailabilityStrip';
import { CrewsStatsTabs, type CrewsStatCounts } from '../crews/CrewsStatsTabs';
import { crewsStatTabFromFacet, facetFromCrewsStatTab } from '../crews/crewsStatTab';

type ListCrewsExplorerHeaderProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onQuerySync: () => void;
  onSearchCommit: (scope?: ExploreSearchScopeKey | null) => void;
  onClearQuery: () => void;
  searchScopeCounts: ExploreSearchScopeCounts;
  mapHref: string;
  crewBrowseLane: CrewBrowseLane;
  crewPeopleFacet: CrewPeopleFacet;
  onCrewBrowseLaneChange: (lane: CrewBrowseLane) => void;
  onCrewPeopleFacetChange: (facet: CrewPeopleFacet) => void;
  crewProfessionalKind: CrewProfessionalKind;
  onCrewProfessionalKindChange: (kind: CrewProfessionalKind) => void;
  stickySearch?: boolean;
  isSignedIn: boolean;
  statCounts: CrewsStatCounts;
  onOpenAvailability: () => void;
  filterCount: number;
  onFilterTap?: () => void;
  suppressSearch?: boolean;
  searchPlaceholder?: string;
  enableSearchScopeHints?: boolean;
  searchResultsChrome?: boolean;
  exploreSearchResults?: boolean;
  mapListResultCount?: number;
};

export const ListCrewsExplorerHeader = ({
  query,
  onQueryChange,
  onQuerySync,
  onSearchCommit,
  onClearQuery,
  searchScopeCounts,
  mapHref,
  crewBrowseLane,
  crewPeopleFacet,
  onCrewBrowseLaneChange,
  onCrewPeopleFacetChange,
  crewProfessionalKind,
  onCrewProfessionalKindChange,
  stickySearch = false,
  isSignedIn,
  statCounts,
  onOpenAvailability,
  filterCount,
  onFilterTap,
  suppressSearch = false,
  searchPlaceholder = EXPLORE_CREWS_SEARCH_PLACEHOLDER,
  enableSearchScopeHints = true,
  searchResultsChrome = false,
  exploreSearchResults = false,
  mapListResultCount = 0,
}: ListCrewsExplorerHeaderProps) => {
  const navigate = useNavigate();
  const displayLane = normalizeCrewBrowseLaneForProduct(crewBrowseLane);
  const searchResultsMapListToggle =
    searchResultsChrome && !exploreSearchResults ? (
      <ExploreMapProjectionToggle
        mode="list"
        variant="map-only"
        toggleChrome="listSide"
        listCount={mapListResultCount}
        onSelectMap={() => navigate(mapHref)}
        onSelectList={() => {}}
      />
    ) : null;

  return (
    <header
      data-consumer-chrome-header
      data-explore-search-chrome={searchResultsChrome ? 'true' : undefined}
      className={`shrink-0 ${LIST_CHROME.chromeBg} ${LIST_CHROME.chromeBorder} ${
        stickySearch ? 'z-30 shadow-[0_4px_16px_rgba(15,23,42,.08)]' : ''
      }`}
    >
      <div
        className={`mx-auto w-full ${
          searchResultsChrome
            ? `max-w-lg px-4 md:px-5 ${LIST_CHROME.standaloneMobileInset}`
            : `max-w-6xl ${LIST_CHROME.horizontalPad} ${LIST_CHROME.standaloneMobileInset}`
        }`}
      >
        <CrewsAvailabilityStrip isSignedIn={isSignedIn} onEdit={onOpenAvailability} />
        {suppressSearch ? (
          <div className="mb-1.5 min-w-0" aria-hidden />
        ) : (
          <div className="mb-1.5 flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1">
              <ListDiscoverySearchField
                query={query}
                onQueryChange={onQueryChange}
                onQuerySync={onQuerySync}
                onSearchCommit={onSearchCommit}
                onClearQuery={onClearQuery}
                searchScopeCounts={searchScopeCounts}
                mapHref={mapHref}
                hideMapLink
                compactTop
                className="!mt-0"
                placeholder={searchPlaceholder}
                enableScopeHints={enableSearchScopeHints}
                trailingChrome={searchResultsChrome ? searchResultsMapListToggle : null}
              />
            </div>
            <button
              type="button"
              className={LIST_HUB_SEARCH_ROW.filterAction(filterCount > 0)}
              aria-label={filterCount > 0 ? `Filter crews, ${filterCount} applied` : 'Filter crews'}
              onClick={onFilterTap}
            >
              <SlidersHorizontal className="h-5 w-5 stroke-[2.25]" aria-hidden />
              {filterCount > 0 ? (
                <span className={LIST_HUB_SEARCH_ROW.filterBadge}>
                  {filterCount > 9 ? '9+' : filterCount}
                </span>
              ) : null}
            </button>
          </div>
        )}
        <div className="mt-1 min-w-0 space-y-2 pb-2">
          <CrewBrowsePanelTabs tab={crewBrowseLane} onTabChange={onCrewBrowseLaneChange} />
          {displayLane === 'people' ? (
            <CrewsStatsTabs
              active={crewsStatTabFromFacet(crewPeopleFacet)}
              counts={statCounts}
              onSelect={(tab) => onCrewPeopleFacetChange(facetFromCrewsStatTab(tab))}
              onClear={() => onCrewPeopleFacetChange(DEFAULT_CREW_PEOPLE_FACET)}
            />
          ) : null}
          {displayLane === 'professional' ? (
            <CrewsProfessionalKindChips
              active={crewProfessionalKind}
              onSelect={onCrewProfessionalKindChange}
              onClear={() => onCrewProfessionalKindChange(crewsProfessionalKindClearTarget())}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
};
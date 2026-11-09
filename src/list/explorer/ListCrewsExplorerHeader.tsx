import { SlidersHorizontal } from 'lucide-react';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';
import { EXPLORE_PEOPLE_BROWSE_SEARCH_PLACEHOLDER } from '../../content/explorePeopleBrowseCopy';
import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import { LIST_CHROME } from '../listChromeTheme';
import { ListDiscoverySearchField } from '../ui/ListDiscoverySearchField';
import { CrewsAvailabilityStrip } from '../crews/CrewsAvailabilityStrip';
import { CrewsStatsTabs, type CrewsStatCounts } from '../crews/CrewsStatsTabs';
import { crewsStatTabFromSegment, segmentFromCrewsStatTab } from '../crews/crewsStatTab';

type ListCrewsExplorerHeaderProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onQuerySync: () => void;
  onSearchCommit: (scope?: ExploreSearchScopeKey | null) => void;
  onClearQuery: () => void;
  searchScopeCounts: ExploreSearchScopeCounts;
  mapHref: string;
  peopleBrowseTab: PeopleBrowseTab;
  onPeopleBrowseTabChange: (tab: PeopleBrowseTab) => void;
  stickySearch?: boolean;
  isSignedIn: boolean;
  statCounts: CrewsStatCounts;
  onOpenAvailability: () => void;
  filterCount: number;
  onFilterTap?: () => void;
};

/** Crews tab — app bar, availability, search, stats tabs, filter affordance. */
export const ListCrewsExplorerHeader = ({
  query,
  onQueryChange,
  onQuerySync,
  onSearchCommit,
  onClearQuery,
  searchScopeCounts,
  mapHref,
  peopleBrowseTab,
  onPeopleBrowseTabChange,
  stickySearch = false,
  isSignedIn,
  statCounts,
  onOpenAvailability,
  filterCount,
  onFilterTap,
}: ListCrewsExplorerHeaderProps) => (
  <header
    data-consumer-chrome-header
    className={`${LIST_CHROME.chromeBg} ${LIST_CHROME.chromeBorder} shrink-0 ${
      stickySearch ? 'z-30 shadow-[0_4px_16px_rgba(15,23,42,.08)]' : ''
    }`}
  >
    <div className={`${LIST_CHROME.horizontalPad} mx-auto w-full max-w-6xl ${LIST_CHROME.standaloneMobileInset}`}>
      <CrewsAvailabilityStrip isSignedIn={isSignedIn} onEdit={onOpenAvailability} />
      <div className="mb-1.5 flex gap-2">
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
            placeholder={EXPLORE_PEOPLE_BROWSE_SEARCH_PLACEHOLDER}
          />
        </div>
        <button
          type="button"
          className="relative mt-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-neutral-200/80"
          aria-label="Filter crews"
          onClick={onFilterTap}
        >
          <SlidersHorizontal className="h-5 w-5 text-neutral-700" aria-hidden />
          {filterCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
              {filterCount}
            </span>
          ) : null}
        </button>
      </div>
      <div className="mt-1 min-w-0 pb-2">
        <CrewsStatsTabs
          active={crewsStatTabFromSegment(peopleBrowseTab)}
          counts={statCounts}
          onSelect={(tab) => onPeopleBrowseTabChange(segmentFromCrewsStatTab(tab))}
          onClear={() => onPeopleBrowseTabChange('hub')}
        />
      </div>
    </div>
  </header>
);

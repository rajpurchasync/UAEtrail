import { MobileMenuButton } from '../../components/layout/MobileMenu';
import { MobileBackButton } from '../../components/mobile/MobileBackButton';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';
import { EXPLORE_PEOPLE_BROWSE_SEARCH_PLACEHOLDER } from '../../content/explorePeopleBrowseCopy';
import { PeopleBrowsePanelTabs } from '@/people-discovery/panel/PeopleBrowsePanelTabs';
import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import { LIST_APP_BAR, LIST_CHROME } from '../listChromeTheme';
import { ListDiscoverySearchField } from '../ui/ListDiscoverySearchField';

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
};

/** Crews tab — same list-page chrome as `ListExplorerHeader` (app bar + search + segment tabs). */
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
}: ListCrewsExplorerHeaderProps) => (
  <header
    data-consumer-chrome-header
    className={`${LIST_CHROME.chromeBg} ${LIST_CHROME.chromeBorder} shrink-0 ${
      stickySearch ? 'z-30 shadow-[0_4px_16px_rgba(15,23,42,.08)]' : ''
    }`}
  >
    <div className={`${LIST_CHROME.horizontalPad} mx-auto w-full max-w-6xl pb-2.5 pt-1`}>
      <div className={`${LIST_APP_BAR.row} mb-1 md:hidden`}>
        <MobileBackButton fallbackTo={mapHref} label="Map" className="!min-h-10 pl-0" />
        <MobileMenuButton className={LIST_CHROME.menuButton} />
      </div>
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
      <div className="mt-1.5 min-w-0">
        <PeopleBrowsePanelTabs tab={peopleBrowseTab} onTabChange={onPeopleBrowseTabChange} />
      </div>
    </div>
  </header>
);

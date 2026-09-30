import type { ExploreSearchScopeCounts, ExploreSearchScopeKey, ExploreMapFilterPillKey } from '../exploreBrowseTaxonomy';
import { EXPLORE_MOBILE_MAP_CHROME, EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreSearchIntentMenu } from './ExploreSearchIntentMenu';
import { ExploreMapTopicPillsRow } from './ExploreMapTopicPillsRow';
import { ExploreMapWhosGoingButton } from './ExploreMapWhosGoingButton';

type ExploreMapChromeBarProps = {
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  searchScopeCounts?: ExploreSearchScopeCounts;
  topicPills: readonly ExploreMapFilterPillKey[];
  onTopicPillToggle: (key: ExploreMapFilterPillKey) => void;
  onWhosGoing?: () => void;
  whosGoingAvatars?: Array<{ id: string; name: string; avatar?: string | null }>;
  whosGoingExtraCount?: number;
  whosGoingTotalJoining?: number;
};

/** Map toolbar — search, Who's going, topic pills (below app header). */
export const ExploreMapChromeBar = ({
  searchQuery = '',
  onSearchQueryChange,
  onSearchCommit,
  searchScopeCounts,
  topicPills,
  onTopicPillToggle,
  onWhosGoing,
  whosGoingAvatars = [],
  whosGoingExtraCount = 0,
  whosGoingTotalJoining = 0,
}: ExploreMapChromeBarProps) => (
  <div
    className={`pointer-events-none absolute inset-x-0 top-0 px-3 pt-2 lg:px-4 lg:pt-3 ${EXPLORE_MOBILE_MAP_CHROME.filterTop} ${EXPLORE_Z.mapFilters}`}
  >
    <div className="pointer-events-auto flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-end lg:gap-2">
      <div className="flex min-w-0 items-center gap-2 lg:hidden">
        {onSearchQueryChange && onSearchCommit ? (
          <ExploreSearchIntentMenu
            variant="map"
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            onQueryCommit={onSearchCommit}
            scopeCounts={searchScopeCounts}
          />
        ) : null}
        {onWhosGoing ? (
          <ExploreMapWhosGoingButton
            avatars={whosGoingAvatars}
            extraCount={whosGoingExtraCount}
            totalJoining={whosGoingTotalJoining}
            onClick={onWhosGoing}
            className="ml-auto"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 lg:hidden">
        <ExploreMapTopicPillsRow selected={topicPills} onToggle={onTopicPillToggle} />
      </div>
      {onWhosGoing ? (
        <ExploreMapWhosGoingButton
          avatars={whosGoingAvatars}
          extraCount={whosGoingExtraCount}
          totalJoining={whosGoingTotalJoining}
          onClick={onWhosGoing}
          className="hidden shrink-0 lg:inline-flex"
        />
      ) : null}
    </div>
  </div>
);

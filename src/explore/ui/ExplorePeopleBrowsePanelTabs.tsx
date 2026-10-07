import { EXPLORE_BROWSE_SEGMENT_TAB } from '../../config/exploreTheme';
import { EXPLORE_PEOPLE_BROWSE_TAB_DISCOVER } from '../../content/explorePeopleBrowseCopy';
import type { ExplorePeopleBrowseTab } from './useExploreBrowseUrlState';

type ExplorePeopleBrowsePanelTabsProps = {
  tab: ExplorePeopleBrowseTab;
  onTabChange: (tab: ExplorePeopleBrowseTab) => void;
  allCount?: number;
  friendsCount?: number;
  followedCount?: number;
};

export const ExplorePeopleBrowsePanelTabs = ({
  tab,
  onTabChange,
  allCount,
  friendsCount,
  followedCount,
}: ExplorePeopleBrowsePanelTabsProps) => (
  <div
    className={`${EXPLORE_BROWSE_SEGMENT_TAB.row} mb-2 min-w-0 max-w-full overflow-x-auto scroll-smooth scrollbar-none`}
    role="tablist"
    aria-label="People browse views"
  >
    <button
      type="button"
      role="tab"
      aria-selected={tab === 'all'}
      className={tab === 'all' ? EXPLORE_BROWSE_SEGMENT_TAB.active : EXPLORE_BROWSE_SEGMENT_TAB.inactive}
      onClick={() => onTabChange('all')}
    >
      All{allCount != null ? ` (${allCount})` : ''}
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={tab === 'friends'}
      className={tab === 'friends' ? EXPLORE_BROWSE_SEGMENT_TAB.active : EXPLORE_BROWSE_SEGMENT_TAB.inactive}
      onClick={() => onTabChange('friends')}
    >
      Friends{friendsCount != null ? ` (${friendsCount})` : ''}
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={tab === 'followed'}
      className={tab === 'followed' ? EXPLORE_BROWSE_SEGMENT_TAB.active : EXPLORE_BROWSE_SEGMENT_TAB.inactive}
      onClick={() => onTabChange('followed')}
    >
      Followed{followedCount != null ? ` (${followedCount})` : ''}
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={tab === 'discover'}
      className={tab === 'discover' ? EXPLORE_BROWSE_SEGMENT_TAB.active : EXPLORE_BROWSE_SEGMENT_TAB.inactive}
      onClick={() => onTabChange('discover')}
    >
      {EXPLORE_PEOPLE_BROWSE_TAB_DISCOVER}
    </button>
  </div>
);

import { EXPLORE_BROWSE_SEGMENT_TAB } from '../../config/exploreTheme';
import { EXPLORE_SOCIAL_TAB_DISCOVER } from '../../content/exploreSocialPanelCopy';
import type { ExploreSocialTab } from './useExploreBrowseUrlState';

type ExploreSocialPanelTabsProps = {
  tab: ExploreSocialTab;
  onTabChange: (tab: ExploreSocialTab) => void;
  allCount?: number;
  friendsCount?: number;
  followedCount?: number;
};

export const ExploreSocialPanelTabs = ({
  tab,
  onTabChange,
  allCount,
  friendsCount,
  followedCount,
}: ExploreSocialPanelTabsProps) => (
  <div
    className={`${EXPLORE_BROWSE_SEGMENT_TAB.row} mb-2 min-w-0 max-w-full overflow-x-auto scroll-smooth scrollbar-none`}
    role="tablist"
    aria-label="Social views"
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
      {EXPLORE_SOCIAL_TAB_DISCOVER}
    </button>
  </div>
);

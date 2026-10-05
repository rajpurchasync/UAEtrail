import { EXPLORE_BROWSE_SEGMENT_TAB } from '../../config/exploreTheme';
import type { ExploreGoingTab } from './useExploreBrowseUrlState';

type ExploreGoingPanelTabsProps = {
  tab: ExploreGoingTab;
  onTabChange: (tab: ExploreGoingTab) => void;
  buddyPresenceCount?: number;
  tripActivityCount?: number;
};

export const ExploreGoingPanelTabs = ({
  tab,
  onTabChange,
  buddyPresenceCount,
  tripActivityCount,
}: ExploreGoingPanelTabsProps) => (
  <div
    className={`${EXPLORE_BROWSE_SEGMENT_TAB.row} min-w-0 overflow-x-auto scroll-smooth scrollbar-none`}
    role="tablist"
    aria-label="Who's going views"
  >
    <button
      type="button"
      role="tab"
      aria-selected={tab === 'people'}
      className={tab === 'people' ? EXPLORE_BROWSE_SEGMENT_TAB.active : EXPLORE_BROWSE_SEGMENT_TAB.inactive}
      onClick={() => onTabChange('people')}
    >
      Buddies{buddyPresenceCount != null ? ` (${buddyPresenceCount})` : ''}
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={tab === 'discover'}
      className={tab === 'discover' ? EXPLORE_BROWSE_SEGMENT_TAB.active : EXPLORE_BROWSE_SEGMENT_TAB.inactive}
      onClick={() => onTabChange('discover')}
    >
      Discover
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={tab === 'trips'}
      className={tab === 'trips' ? EXPLORE_BROWSE_SEGMENT_TAB.active : EXPLORE_BROWSE_SEGMENT_TAB.inactive}
      onClick={() => onTabChange('trips')}
    >
      Trips{tripActivityCount != null ? ` (${tripActivityCount})` : ''}
    </button>
  </div>
);

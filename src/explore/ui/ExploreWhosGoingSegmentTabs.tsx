import { EXPLORE_BROWSE_SEGMENT_TAB } from '../../config/exploreTheme';

type WhosGoingSegment = 'people' | 'discover' | 'trips';

type ExploreWhosGoingSegmentTabsProps = {
  segment: WhosGoingSegment;
  onSegmentChange: (segment: WhosGoingSegment) => void;
  peopleCount?: number;
  tripsCount?: number;
};

export const ExploreWhosGoingSegmentTabs = ({
  segment,
  onSegmentChange,
  peopleCount,
  tripsCount,
}: ExploreWhosGoingSegmentTabsProps) => (
  <div
    className={`${EXPLORE_BROWSE_SEGMENT_TAB.row} min-w-0 overflow-x-auto scroll-smooth scrollbar-none`}
    role="tablist"
    aria-label="Who's going views"
  >
    <button
      type="button"
      role="tab"
      aria-selected={segment === 'people'}
      className={segment === 'people' ? EXPLORE_BROWSE_SEGMENT_TAB.active : EXPLORE_BROWSE_SEGMENT_TAB.inactive}
      onClick={() => onSegmentChange('people')}
    >
      Friends{peopleCount != null ? ` (${peopleCount})` : ''}
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={segment === 'discover'}
      className={segment === 'discover' ? EXPLORE_BROWSE_SEGMENT_TAB.active : EXPLORE_BROWSE_SEGMENT_TAB.inactive}
      onClick={() => onSegmentChange('discover')}
    >
      Discover
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={segment === 'trips'}
      className={segment === 'trips' ? EXPLORE_BROWSE_SEGMENT_TAB.active : EXPLORE_BROWSE_SEGMENT_TAB.inactive}
      onClick={() => onSegmentChange('trips')}
    >
      Trips{tripsCount != null ? ` (${tripsCount})` : ''}
    </button>
  </div>
);

export type { WhosGoingSegment };

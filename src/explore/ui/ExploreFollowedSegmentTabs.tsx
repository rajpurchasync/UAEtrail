import { EXPLORE_BROWSE_SEGMENT_TAB } from '../../config/exploreTheme';
import {
  EXPLORE_PEOPLE_BROWSE_FOLLOWED_SEGMENT_EVENTS,
  EXPLORE_PEOPLE_BROWSE_FOLLOWED_SEGMENT_PEOPLE,
  EXPLORE_PEOPLE_BROWSE_FOLLOWED_SEGMENT_PLACES,
} from '../../content/explorePeopleBrowseCopy';
import type { ExploreFollowedSegment } from './useExploreBrowseUrlState';

type ExploreFollowedSegmentTabsProps = {
  segment: ExploreFollowedSegment;
  onSegmentChange: (segment: ExploreFollowedSegment) => void;
};

export const ExploreFollowedSegmentTabs = ({
  segment,
  onSegmentChange,
}: ExploreFollowedSegmentTabsProps) => (
  <div
    className={`${EXPLORE_BROWSE_SEGMENT_TAB.row} mb-3 min-w-0 overflow-x-auto scroll-smooth scrollbar-none`}
    role="tablist"
    aria-label="Followed categories"
  >
    {(
      [
        ['people', EXPLORE_PEOPLE_BROWSE_FOLLOWED_SEGMENT_PEOPLE],
        ['places', EXPLORE_PEOPLE_BROWSE_FOLLOWED_SEGMENT_PLACES],
        ['events', EXPLORE_PEOPLE_BROWSE_FOLLOWED_SEGMENT_EVENTS],
      ] as const
    ).map(([key, label]) => (
      <button
        key={key}
        type="button"
        role="tab"
        aria-selected={segment === key}
        className={
          segment === key ? EXPLORE_BROWSE_SEGMENT_TAB.active : EXPLORE_BROWSE_SEGMENT_TAB.inactive
        }
        onClick={() => onSegmentChange(key)}
      >
        {label}
      </button>
    ))}
  </div>
);

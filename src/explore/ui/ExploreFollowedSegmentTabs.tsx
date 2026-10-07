import { EXPLORE_BROWSE_SEGMENT_TAB } from '../../config/exploreTheme';
import {
  EXPLORE_SOCIAL_FOLLOWED_SEGMENT_EVENTS,
  EXPLORE_SOCIAL_FOLLOWED_SEGMENT_PEOPLE,
  EXPLORE_SOCIAL_FOLLOWED_SEGMENT_PLACES,
} from '../../content/exploreSocialPanelCopy';
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
        ['people', EXPLORE_SOCIAL_FOLLOWED_SEGMENT_PEOPLE],
        ['places', EXPLORE_SOCIAL_FOLLOWED_SEGMENT_PLACES],
        ['events', EXPLORE_SOCIAL_FOLLOWED_SEGMENT_EVENTS],
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

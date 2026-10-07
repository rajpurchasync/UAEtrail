import type { ExploreActivityDatePreset } from '../../explore/exploreActivityDateFilter';
import { ExploreMapDateFilter } from '../../explore/ui/ExploreMapDateFilter';
import type { BuddiesDiscoverySegment } from '../buddiesDiscoverySegment';
import { listCategoryPillClass } from '../listChromeTheme';
import { ListBuddiesSegmentPills } from './ListBuddiesSegmentPills';

type ListBuddiesCategoryToolbarProps = {
  segment: BuddiesDiscoverySegment;
  onSegmentChange: (segment: BuddiesDiscoverySegment) => void;
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
};

/** Buddies list — segment pills + outing date (applies to Who's going / Looking for). */
export const ListBuddiesCategoryToolbar = ({
  segment,
  onSegmentChange,
  activityDatePreset,
  onActivityDatePresetChange,
}: ListBuddiesCategoryToolbarProps) => (
  <div className="flex w-full items-center gap-2 pt-0.5">
    <ListBuddiesSegmentPills segment={segment} onSegmentChange={onSegmentChange} />
    {segment !== 'followed' ? (
      <ExploreMapDateFilter
        activityDatePreset={activityDatePreset}
        onActivityDatePresetChange={onActivityDatePresetChange}
        includeAnyday={false}
        textTrigger
        textTriggerClassName={listCategoryPillClass(activityDatePreset !== 'anyday')}
      />
    ) : null}
  </div>
);

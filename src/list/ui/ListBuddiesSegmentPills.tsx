import type { BuddiesDiscoverySegment } from '../buddiesDiscoverySegment';
import { BUDDIES_DISCOVERY_SEGMENTS } from '../buddiesDiscoverySegment';
import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../listChromeTheme';

type ListBuddiesSegmentPillsProps = {
  segment: BuddiesDiscoverySegment;
  onSegmentChange: (segment: BuddiesDiscoverySegment) => void;
};

export const ListBuddiesSegmentPills = ({ segment, onSegmentChange }: ListBuddiesSegmentPillsProps) => (
  <div className={`min-w-0 flex-1 ${LIST_CHIP_SCROLL}`}>
    {BUDDIES_DISCOVERY_SEGMENTS.map(({ key, label }) => (
      <button
        key={key}
        type="button"
        onClick={() => onSegmentChange(key)}
        className={listCategoryPillClass(segment === key)}
        aria-pressed={segment === key}
      >
        {label}
      </button>
    ))}
  </div>
);

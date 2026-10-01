import type { TripsSegment } from '../../trips/tripsRouting';
import { FilterChips } from '../mobile/FilterChips';

type TripsSegmentScrollProps = {
  tabs: { id: TripsSegment; label: string }[];
  activeId: TripsSegment;
  onChange: (id: TripsSegment) => void;
};

/** Primary trips segments — shared {@link FilterChips} (neutral active). */
export const TripsSegmentScroll = ({ tabs, activeId, onChange }: TripsSegmentScrollProps) => (
  <FilterChips
    variant="neutral"
    options={tabs.map((tab) => ({ key: tab.id, label: tab.label }))}
    value={activeId}
    onChange={onChange}
  />
);

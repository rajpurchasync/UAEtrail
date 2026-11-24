import { listChipClass } from '@/list/browse/listChromeTheme';
import type { CrewBrowseLane } from '@/crew-discovery/crewBrowseState';
import {
  FIND_CREW_RECOMMENDED_TABS,
  normalizeFindCrewRecommendedLane,
  type FindCrewRecommendedTab,
} from './findCrewRecommendedTabs';

type FindCrewMainTabsProps = {
  active: CrewBrowseLane;
  onChange: (lane: FindCrewRecommendedTab) => void;
};

/** Recommended pills — People · Groups · Trips (search-led Find crew). */
export const FindCrewMainTabs = ({ active, onChange }: FindCrewMainTabsProps) => {
  const normalized = normalizeFindCrewRecommendedLane(active);

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Find crew category">
      {FIND_CREW_RECOMMENDED_TABS.map(({ lane, label }) => {
        const selected = normalized === lane;
        return (
          <button
            key={lane}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(lane)}
            className={listChipClass(selected)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};